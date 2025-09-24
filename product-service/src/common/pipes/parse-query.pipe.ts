import { CustomFilter } from '@Common/enums/custom-filter.enum';
import { HashidsService } from '@HashIds/hashids.service';
import Constants from '@Helper/constants';
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

interface RawQueryParams {
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  select?: string;
  filter?: string | Record<string, any>;
  expression?: CustomFilter;
  type?: string;
  query?: string;
  [key: string]: any;
}

export interface TransformedQuery {
  page: number;
  pageSize: number;
  orderBy?: { [key: string]: 'asc' | 'desc' };
  select?: { [key: string]: boolean };
  where?: Record<string, any>;
  customCategoryExpression?: CustomFilter;
  type?: string;
  query?: string;
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

enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  LOOKUP = 'lookup',
}

@Injectable()
export class ParseQueryPipe
  implements PipeTransform<RawQueryParams, TransformedQuery>
{
  constructor(private readonly hashIds: HashidsService) {}

  transform(
    value: RawQueryParams,
    metadata: ArgumentMetadata,
  ): TransformedQuery {
    if (metadata.type !== 'query' || !value) {
      return value as any;
    }

    console.log('Raw query params:', value);

    const {
      page,
      pageSize,
      sortBy,
      sortDir,
      select,
      expression,
      type,
      query,
      ...filterQueryParams
    } = value;

    const transformed: TransformedQuery = {
      page: parseInt(page || '1', 10),
      pageSize: Number(pageSize) || Constants.MAX_PAGE_SIZE,
    };

    if (type) {
      transformed.type = type;
    }
    if (query) {
      transformed.query = query;
    }

    // Parse orderBy
    if (sortBy && sortDir) {
      if (sortDir !== 'asc' && sortDir !== 'desc') {
        throw new BadRequestException(
          'Validation failed: sortDir must be "asc" or "desc".',
        );
      }
      transformed.orderBy = { [sortBy]: sortDir };
    } else {
      transformed.orderBy = { created_at: 'desc' };
    }

    // Parse select
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

    // Parse filters
    console.log('Filter params to process:', filterQueryParams);
    const where = this.parseGroupedFilter(filterQueryParams);
    console.log('Parsed where object:', JSON.stringify(where, null, 2));

    if (Object.keys(where).length > 0) {
      transformed.where = {
        ...where,
        is_deleted: false,
      };
    } else {
      transformed.where = { is_deleted: false };
    }

    // Parse custom category expression
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

    console.log(
      'Final transformed where:',
      JSON.stringify(transformed.where, null, 2),
    );

    return transformed;
  }

  private buildNestedFilter(
    root: Record<string, any>,
    parts: string[],
    rawValue: any,
  ) {
    if (parts.length === 0) {
      return;
    }

    console.log(
      'Building nested filter with parts:',
      parts,
      'value:',
      rawValue,
    );

    const currentPart = parts.shift()!;

    // Handle product_id decoding
    if (currentPart === 'product_id' || currentPart === 'productId') {
      rawValue = this.hashIds.decode(rawValue);
    }

    // Remove the EAV detection from here since we handle it in parseGroupedFilter

    const prismaOperator = operatorMap[currentPart];

    // Handle logical operators
    if (
      prismaOperator === 'AND' ||
      prismaOperator === 'OR' ||
      prismaOperator === 'NOT'
    ) {
      const isArray = !isNaN(Number(parts[0]));
      if (isArray) {
        const index = Number(parts.shift());
        root[prismaOperator] ??= [];
        root[prismaOperator][index] ??= {};
        this.buildNestedFilter(root[prismaOperator][index], parts, rawValue);
      } else {
        root[prismaOperator] ??= [];
        const newObj = {};
        root[prismaOperator].push(newObj);
        this.buildNestedFilter(newObj, parts, rawValue);
      }
      return;
    }

    // Handle relation filters
    if (
      prismaOperator === 'every' ||
      prismaOperator === 'some' ||
      prismaOperator === 'none'
    ) {
      root[currentPart] ??= {};
      this.buildNestedFilter(root[currentPart], parts, rawValue);
      return;
    }

    // Handle final field or nested relation
    const nextPartIsOperator = parts.length === 1 && operatorMap[parts[0]];
    const nextPartIsMode =
      parts.length === 2 && operatorMap[parts[0]] && parts[1] === 'in';

    if (nextPartIsOperator || nextPartIsMode) {
      const operator = operatorMap[parts.shift()!];
      let value = this.parseValue(rawValue);

      if (operator === 'in' || operator === 'notIn') {
        value = String(value)
          .split(',')
          .map((v) => this.parseValue(v));
      }

      const condition: Record<string, any> = { [operator]: value };

      if (parts.length > 0 && parts[0] === 'in') {
        if (
          ['equals', 'contains', 'startsWith', 'endsWith'].includes(operator)
        ) {
          condition.mode = 'insensitive';
        }
        parts.shift();
      }

      root[currentPart] = condition;
    } else {
      root[currentPart] ??= {};
      this.buildNestedFilter(root[currentPart], parts, rawValue);
    }
  }

  // Also update the buildEAVFilter method to handle the correct parsing:

  private buildEAVFilter(
    root: Record<string, any>,
    parts: string[],
    rawValue: any,
  ) {
    console.log('Building EAV filter with parts:', parts, 'value:', rawValue);

    // For filter[attribute][10][number][gte]=40
    // parts should be ['10', 'number', 'gte']
    if (parts.length < 3) {
      throw new BadRequestException(
        'Invalid EAV filter format. Expected: attribute[{attributeId}][{dataType}][{operator}]',
      );
    }

    const attributeId = parts.shift()!; // '10'
    const dataType = parts.shift()! as DataType; // 'number'
    const operator = parts.shift()!; // 'gte'

    console.log('EAV filter components:', {
      attributeId,
      dataType,
      operator,
      rawValue,
    });

    // Validate data type
    if (!Object.values(DataType).includes(dataType as DataType)) {
      throw new BadRequestException(
        `Invalid data type "${dataType}". Allowed values are: ${Object.values(
          DataType,
        ).join(', ')}`,
      );
    }

    // Validate operator
    const prismaOperator = operatorMap[operator];
    if (!prismaOperator) {
      throw new BadRequestException(
        `Invalid operator "${operator}". Allowed values are: ${Object.keys(
          operatorMap,
        ).join(', ')}`,
      );
    }

    // Parse value based on data type
    let parsedValue = this.parseValueByDataType(rawValue, dataType);

    // Handle array operators
    if (prismaOperator === 'in' || prismaOperator === 'notIn') {
      parsedValue = String(rawValue)
        .split(',')
        .map((v) => this.parseValueByDataType(v.trim(), dataType));
    }

    // Get the correct value field for this data type
    const valueField = this.getValueFieldByDataType(dataType);

    console.log('Value field:', valueField, 'parsed value:', parsedValue);

    // Build the condition for the specific value field
    const valueCondition: Record<string, any> = {
      [prismaOperator]: parsedValue,
    };

    // Handle case-insensitive mode for string operations
    if (
      dataType === DataType.STRING &&
      ['equals', 'contains', 'startsWith', 'endsWith'].includes(prismaOperator)
    ) {
      valueCondition.mode = 'insensitive';
    }

    // Build the complete EAV filter structure
    const eavFilter = {
      attributeValues: {
        some: {
          AND: [
            {
              attributeCategoryMapping: {
                attribute: {
                  id: parseInt(attributeId, 10),
                  is_deleted: false,
                },
                is_deleted: false,
              },
            },
            {
              [valueField]: valueCondition,
            },
            {
              is_deleted: false,
            },
          ],
        },
      },
    };

    console.log('Built EAV filter:', JSON.stringify(eavFilter, null, 2));

    // Add to root - always add to AND array for EAV filters
    if (!root.AND) {
      root.AND = [];
    }
    root.AND.push(eavFilter);
  }

  private getValueFieldByDataType(dataType: string): string {
    switch (dataType) {
      case DataType.STRING:
        return 'string_value';
      case DataType.NUMBER:
        return 'number_value';
      case DataType.BOOLEAN:
        return 'boolean_value';
      case DataType.DATE:
        return 'date_value';
      case DataType.LOOKUP:
        return 'lookup_name';
      default:
        throw new BadRequestException(`Unsupported data type: ${dataType}`);
    }
  }

  private parseValueByDataType(value: string, dataType: string): any {
    switch (dataType) {
      case DataType.STRING:
      case DataType.LOOKUP:
        return value;
      case DataType.NUMBER:
        const num = Number(value);
        if (isNaN(num)) {
          throw new BadRequestException(`Invalid number value: ${value}`);
        }
        return num;
      case DataType.BOOLEAN:
        if (value === 'true') return true;
        if (value === 'false') return false;
        throw new BadRequestException(
          `Invalid boolean value: ${value}. Must be 'true' or 'false'.`,
        );
      case DataType.DATE:
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new BadRequestException(
            `Invalid date value: ${value}. Must be a valid ISO date string.`,
          );
        }
        return date;
      default:
        throw new BadRequestException(`Unsupported data type: ${dataType}`);
    }
  }

  private parseGroupedFilter(
    flatFilter: Record<string, any>,
  ): Record<string, any> {
    const root: Record<string, any> = {};
    const andGroup: Record<string, any>[] = [];

    for (const [key, rawValue] of Object.entries(flatFilter)) {
      if (!key.startsWith('filter')) continue;

      console.log('Processing filter key:', key, 'value:', rawValue);

      const parts = key.match(/\[(.+?)\]/g)?.map((x) => x.slice(1, -1));
      if (!parts) continue;
      parts.shift(); // remove 'filter'

      console.log('Filter parts after removing "filter":', parts);

      // IMPORTANT: Check for EAV attribute filter BEFORE processing as array
      // For filter[attribute][10][number][gte], parts = ['attribute', '10', 'number', 'gte']
      if (parts.length >= 4 && parts[0] === 'attribute') {
        console.log('Detected EAV attribute filter:', parts);
        // Remove 'attribute' and pass the remaining parts
        const eavParts = parts.slice(1); // ['10', 'number', 'gte']
        this.buildEAVFilter(root, eavParts, rawValue);
        continue;
      }

      // Check if the top-level is an implicit array (numeric index)
      if (!isNaN(Number(parts[0]))) {
        const index = Number(parts.shift());
        andGroup[index] ??= {};
        this.buildNestedFilter(andGroup[index], parts, rawValue);
      } else {
        this.buildNestedFilter(root, parts, rawValue);
      }
    }

    if (andGroup.length > 0) {
      if (root.AND) {
        root.AND = [...root.AND, ...andGroup];
      } else {
        root.AND = andGroup;
      }
    }

    return root;
  }

  private parseValue(val: string): any {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (!isNaN(Number(val))) {
      const num = Number(val);
      if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
        return BigInt(val);
      }
      return num;
    }
    return val;
  }
}
