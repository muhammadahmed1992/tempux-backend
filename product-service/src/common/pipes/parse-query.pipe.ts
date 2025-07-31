import { CustomFilter } from '@Common/enums/custom-filter.enum';
import Constants from '@Helper/constants';
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * Interface for the raw incoming query parameters (before transformation).
 * This helps with type safety for the input to the pipe.
 */
interface RawQueryParams {
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  select?: string;
  // The filter parameter is automatically an object from the query parser
  // when using NestJS, but we can also handle a JSON string just in case.
  filter?: string | Record<string, any>;
  expression?: CustomFilter;
  // This captures all other query parameters that don't match the above
  [key: string]: any;
}

/**
 * Interface for the transformed output object, ready for repository consumption.
 */
export interface TransformedQuery {
  page: number;
  pageSize: number;
  orderBy?: { [key: string]: 'asc' | 'desc' };
  select?: { [key: string]: boolean };
  where?: Record<string, any>;
  customCategoryExpression?: CustomFilter;
}

type PrismaOperator =
  | 'equals'
  | 'not'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'some'
  | 'every'
  | 'none'
  | 'AND'
  | 'OR'
  | 'NOT';

const operatorMap: Record<string, PrismaOperator> = {
  eq: 'equals',
  ne: 'not',
  gt: 'gt',
  lt: 'lt',
  gte: 'gte',
  lte: 'lte',
  contains: 'contains',
  startsWith: 'startsWith',
  endsWith: 'endsWith',
  in: 'in',
  notIn: 'notIn',
  some: 'some',
  every: 'every',
  none: 'none',
  and: 'AND',
  or: 'OR',
  not: 'NOT',
};

/**
 * A comprehensive NestJS pipe to parse and transform various query parameters
 * into a structured object suitable for Prisma repository methods.
 */
@Injectable()
export class ParseQueryPipe
  implements PipeTransform<RawQueryParams, TransformedQuery>
{
  transform(
    value: RawQueryParams,
    metadata: ArgumentMetadata,
  ): TransformedQuery {
    if (metadata.type !== 'query' || !value) {
      return value as any;
    }

    // Capture everything not explicitly defined
    const {
      page,
      pageSize,
      sortBy,
      sortDir,
      select,
      expression,
      ...filterQueryParams
    } = value;

    const transformed: TransformedQuery = {
      page: parseInt(page || '1', 10),
      pageSize: Number(pageSize) || Constants.MAX_PAGE_SIZE,
    };

    // 1. Parse and transform 'orderBy'
    if (sortBy && sortDir) {
      if (sortDir !== 'asc' && sortDir !== 'desc') {
        throw new BadRequestException(
          'Validation failed: sortDir must be "asc" or "desc".',
        );
      }
      transformed.orderBy = { [sortBy]: sortDir };
    } else {
      // Default ordering to descending by created_at, which is more common
      transformed.orderBy = { created_at: 'desc' };
    }

    // 2. Parse and transform 'select'
    if (select) {
      if (typeof select !== 'string') {
        throw new BadRequestException(
          'Validation failed: Select parameter must be a comma-separated string.',
        );
      }
      transformed.select = select.split(',').reduce((acc: any, key) => {
        const trimmedKey = key.trim();
        if (trimmedKey) {
          acc[trimmedKey] = true;
        }
        return acc;
      }, {});
    }

    // 3. Parse and transform 'filter'
    const where = this.parseGroupedFilter(filterQueryParams);

    if (Object.keys(where).length > 0) {
      // Assign the transformed filter to 'where'. Also appending is_deleted: false by default.
      transformed.where = {
        AND: [where], // Wrap existing filters in an AND for clean combination
        is_deleted: false,
      };
    } else {
      // If no custom filters, just apply the default 'is_deleted: false'
      transformed.where = { is_deleted: false };
    }

    // 4. Parse custom category expression
    if (expression) {
      if (!Object.values(CustomFilter).includes(expression)) {
        throw new BadRequestException(
          `Validation failed: Invalid custom expression "${expression}". Allowed values are: ${Object.values(
            CustomFilter,
          ).join(', ')}`,
        );
      }
      transformed.customCategoryExpression = expression;
    }

    return transformed;
  }

  /**
   * Recursively builds a nested Prisma filter object from query parameter parts.
   * @param root The current object being built.
   * @param parts The remaining parts of the filter key (e.g., ['product', 'productTags', 'every', 'tag_id', 'eq']).
   * @param rawValue The value from the query parameter.
   */
  private buildNestedFilter(
    root: Record<string, any>,
    parts: string[],
    rawValue: any,
  ) {
    if (parts.length === 0) {
      return;
    }

    const currentPart = parts.shift()!;
    const prismaOperator = operatorMap[currentPart];

    // Check for logical operators (AND, OR, NOT)
    if (
      prismaOperator === 'AND' ||
      prismaOperator === 'OR' ||
      prismaOperator === 'NOT'
    ) {
      const isArray = !isNaN(Number(parts[0])); // Check if the next part is a number index
      if (isArray) {
        const index = Number(parts.shift());
        root[prismaOperator] ??= [];
        root[prismaOperator][index] ??= {};
        this.buildNestedFilter(root[prismaOperator][index], parts, rawValue);
      } else {
        // This handles ?filter[or][title][eq]=...
        root[prismaOperator] ??= [];
        const newObj = {};
        root[prismaOperator].push(newObj);
        this.buildNestedFilter(newObj, parts, rawValue);
      }
      return;
    }

    // Check for relation filters (every, some, none)
    if (
      prismaOperator === 'every' ||
      prismaOperator === 'some' ||
      prismaOperator === 'none'
    ) {
      root[currentPart] ??= {};
      this.buildNestedFilter(root[currentPart], parts, rawValue);
      return;
    }

    // This is the final field or nested relation
    const nextPartIsOperator = parts.length === 1 && operatorMap[parts[0]];
    const nextPartIsMode =
      parts.length === 2 && operatorMap[parts[0]] && parts[1] === 'in'; // e.g., 'eq' + 'in' for insensitive mode

    if (nextPartIsOperator || nextPartIsMode) {
      const operator = operatorMap[parts.shift()!];
      let value = this.parseValue(rawValue);

      // Handle 'in' and 'notIn' which take an array
      if (operator === 'in' || operator === 'notIn') {
        value = String(value)
          .split(',')
          .map((v) => this.parseValue(v));
      }

      const condition: Record<string, any> = { [operator]: value };

      // Handle case-insensitive mode
      if (parts.length > 0 && parts[0] === 'in') {
        // This is for `[eq][in]` syntax
        if (
          ['equals', 'contains', 'startsWith', 'endsWith'].includes(operator)
        ) {
          condition.mode = 'insensitive';
        }
        parts.shift(); // consume the mode part
      }

      // Assign the final condition to the field
      root[currentPart] = condition;
    } else {
      // Keep going down the chain for nested relations
      root[currentPart] ??= {};
      this.buildNestedFilter(root[currentPart], parts, rawValue);
    }
  }

  /**
   * Parses and transforms the query parameters into a structured 'where' object.
   * This is the entry point for filter parsing.
   */
  private parseGroupedFilter(
    flatFilter: Record<string, any>,
  ): Record<string, any> {
    const root: Record<string, any> = {};
    const andGroup: Record<string, any>[] = [];

    for (const [key, rawValue] of Object.entries(flatFilter)) {
      if (!key.startsWith('filter')) continue;

      const parts = key.match(/\[(.+?)\]/g)?.map((x) => x.slice(1, -1));
      if (!parts) continue;
      parts.shift(); // remove 'filter'

      // Check if the top-level is an implicit array (e.g., `filter[0]...`)
      if (!isNaN(Number(parts[0]))) {
        const index = Number(parts.shift());
        andGroup[index] ??= {};
        this.buildNestedFilter(andGroup[index], parts, rawValue);
      } else {
        // This is a top-level key filter (e.g., `filter[name]...`)
        this.buildNestedFilter(root, parts, rawValue);
      }
    }

    if (andGroup.length > 0) {
      // Merge the top-level AND group into the root
      root.AND = andGroup;
    }

    return root;
  }

  private parseValue(val: string): any {
    if (val === 'true') return true;
    if (val === 'false') return false;
    // Check if it can be a number
    if (!isNaN(Number(val))) {
      // Use BigInt for large numbers to prevent precision issues
      const num = Number(val);
      if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
        return BigInt(val);
      }
      return num;
    }
    return val;
  }
}
