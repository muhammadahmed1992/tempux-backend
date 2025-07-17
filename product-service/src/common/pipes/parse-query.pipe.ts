import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";

/**
 * Interface for the raw incoming query parameters (before transformation).
 * This helps with type safety for the input to the pipe.
 */
interface RawQueryParams {
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc"; // Assuming sort direction is strictly 'asc' or 'desc'
  select?: string;
  filter?: string | object; // Filter can come as a string (JSON) or already parsed object
  // Add other raw query parameters as needed
  [key: string]: any; // Allow for other arbitrary query parameters
}

/**
 * Interface for the transformed output object, ready for repository consumption.
 */
export interface TransformedQuery {
  page: number;
  pageSize: number;
  orderBy?: { [key: string]: "asc" | "desc" };
  select?: { [key: string]: boolean };
  where?: any; // Using 'any' for flexibility with complex filter structures
}
type PrismaOperator =
  | "equals"
  | "not"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "in"
  | "notIn";

const operatorMap: Record<string, PrismaOperator> = {
  eq: "equals",
  ne: "not",
  gt: "gt",
  lt: "lt",
  gte: "gte",
  lte: "lte",
  contains: "contains",
  startsWith: "startsWith",
  endsWith: "endsWith",
  in: "in",
  notIn: "notIn",
};
/**
 * Example:
 *  Basic: ?filter[title][eq]=Hamilton
 *  Case-insensitive: ?filter[title][eq][in]=Hamilton
 *  IN: ?filter[title][in]=Hamilton,Omega
 *  OR: ?filter[or][0][title][eq]=Hamilton&filter[or][1][title][eq]=Omega
 *  Nested: ?filter[or][0][title][eq]=Hamilton&filter[or][1][and][0][image][eq]=abc.png&filter[or][1][and][1][id][eq]=4
 */
/**
 * A comprehensive NestJS pipe to parse and transform various query parameters
 * into a structured object suitable for Prisma repository methods.
 *
 * It handles:
 * - Parsing 'page' and 'pageSize' to numbers.
 * - Transforming 'sortBy' and 'sortDir' into an 'orderBy' object.
 * - Transforming 'select' (comma-separated string) into a Prisma-compatible select object.
 * - Transforming 'filter' (JSON string or object) including:
 * - Converting "true"/"false" strings to booleans.
 * - Splitting comma-separated strings in nested `in` clauses (e.g., `role.in`).
 */
@Injectable()
export class ParseQueryPipe
  implements PipeTransform<RawQueryParams, TransformedQuery>
{
  transform(
    value: RawQueryParams,
    metadata: ArgumentMetadata
  ): TransformedQuery {
    // This pipe is specifically designed for query parameters.
    if (metadata.type !== "query") {
      // If used on a different type of parameter (e.g., body), just pass it through.
      // Or, throw an error if it should only be used for query parameters.
      return value as any; // Cast to any to satisfy return type, though this scenario should be avoided
    }

    const { page, pageSize, sortBy, sortDir, select, ...filter } = value;

    const transformed: TransformedQuery = {
      page: parseInt(page || "1", 10), // Default to page 1
      pageSize: parseInt(pageSize || "1000000", 10), // Default to pageSize 100000
    };

    // 1. Parse and transform 'orderBy'
    if (sortBy && sortDir) {
      if (sortDir !== "asc" && sortDir !== "desc") {
        throw new BadRequestException(
          'Validation failed: sortDir must be "asc" or "desc".'
        );
      }
      transformed.orderBy = { [sortBy]: sortDir };
    } else {
      // Default ordering if not specified
      transformed.orderBy = { created_at: "asc" };
    }

    // 2. Parse and transform 'select'
    if (select) {
      if (typeof select !== "string") {
        throw new BadRequestException(
          "Validation failed: Select parameter must be a comma-separated string."
        );
      }
      transformed.select = select.split(",").reduce((acc: any, key: string) => {
        const trimmedKey = key.trim();
        if (trimmedKey) {
          acc[trimmedKey] = true;
        }
        return acc;
      }, {});
    }

    // 3. Parse and transform 'filter' (which will become 'where' for Prisma)
    let parsedFilter: any = {};
    if (filter) {
      if (typeof filter === "string") {
        try {
          // Attempt to parse filter as JSON string
          parsedFilter = JSON.parse(filter);
        } catch (e) {
          throw new BadRequestException(
            "Validation failed: Filter parameter must be a valid JSON string."
          );
        }
      } else if (typeof filter === "object" && filter !== null) {
        // If filter is already an object (e.g., from a DTO with @Type(() => Object) )
        const where = this.parseGroupedFilter(filter);
        parsedFilter = where;
      } else {
        throw new BadRequestException(
          "Validation failed: Filter parameter must be a JSON string or an object."
        );
      }

      // // Apply transformations to the parsed filter object
      // // Convert "true"/"false" strings to booleans
      // if (typeof parsedFilter.is_deleted === "string") {
      //   if (parsedFilter.is_deleted === "true") {
      //     parsedFilter.is_deleted = true;
      //   } else if (parsedFilter.is_deleted === "false") {
      //     parsedFilter.is_deleted = false;
      //   } else {
      //     // Optional: throw error for invalid boolean string
      //     // throw new BadRequestException('Validation failed: isActive must be "true" or "false".');
      //   }
      // }

      // // Split comma-separated strings in 'role.in'
      // // This assumes a structure like { role: { in: "admin,user" } }
      // if (parsedFilter.role && typeof parsedFilter.role.in === "string") {
      //   parsedFilter.role.in = parsedFilter.role.in
      //     .split(",")
      //     .map((s: string) => s.trim());
      // }
      // Add more specific filter transformations here as needed for your models
      // Example: if you have `priceRange: "100-200"`
      // if (typeof parsedFilter.priceRange === 'string') {
      //   const [min, max] = parsedFilter.priceRange.split('-').map(Number);
      //   parsedFilter.price = { gte: min, lte: max };
      //   delete parsedFilter.priceRange;
      // }
    }
    transformed.where = parsedFilter; // Assign the transformed filter to 'where'

    // You can also include any other remaining query parameters if needed
    // transformed.extraParams = rest;

    return transformed;
  }

  // transformFilter(flatFilter: Record<string, any>): Record<string, any> {
  //   const prismaWhere: Record<string, any> = {};
  //   const AND: any[] = [];
  //   const OR: any[] = [];

  //   for (const [key, value] of Object.entries(flatFilter)) {
  //     // New: filter[or][0][title][eq][in] → groups: or, 0, title, eq, mode
  //     const match = key.match(
  //       /filter\[(or|and)?\](?:\[(\d+)\])?\[(.+?)\]\[(.+?)\](?:\[(.+?)\])?/
  //     );

  //     if (!match) continue;

  //     const [, logic, idx, field, op, modeSuffix] = match;
  //     const index = Number(idx);
  //     const prismaOp = operatorMap[op];
  //     if (!prismaOp) continue;

  //     let mode: "insensitive" | "default" | undefined;

  //     if (modeSuffix === "in") {
  //       mode = "insensitive";
  //     } else if (modeSuffix === "se") {
  //       mode = "default";
  //     }

  //     const parsedValue = this.parseValue(value);

  //     const condition: any = {
  //       [field]: {
  //         [prismaOp]:
  //           prismaOp === "in" || prismaOp === "notIn"
  //             ? parsedValue.split(",").map((v: string) => this.parseValue(v))
  //             : parsedValue,
  //       },
  //     };

  //     if (
  //       mode === "insensitive" &&
  //       ["equals", "contains", "startsWith", "endsWith"].includes(prismaOp)
  //     ) {
  //       condition[field].mode = "insensitive";
  //     }

  //     if (logic === "or") {
  //       OR[index] = condition;
  //     } else if (logic === "and") {
  //       AND[index] = condition;
  //     } else {
  //       prismaWhere[field] = prismaWhere[field] || {};
  //       prismaWhere[field][prismaOp] = condition[field][prismaOp];
  //       if (condition[field].mode) {
  //         prismaWhere[field].mode = condition[field].mode;
  //       }
  //     }
  //   }

  //   const final: Record<string, any> = {};

  //   if (Object.keys(prismaWhere).length > 0) {
  //     Object.assign(final, prismaWhere);
  //   }
  //   if (AND.length > 0) final.AND = AND.filter(Boolean);
  //   if (OR.length > 0) final.OR = OR.filter(Boolean);

  //   return final;
  // }

  parseValue(val: string): any {
    if (val === "true") return true;
    if (val === "false") return false;
    if (!isNaN(Number(val))) return Number(val);
    return val;
  }

  private parseGroupedFilter(flatFilter: Record<string, any>) {
    const root: Record<string, any> = {};

    for (const [key, rawValue] of Object.entries(flatFilter)) {
      if (!key.startsWith("filter")) continue;

      const parts = key.match(/\[(.+?)\]/g)?.map((x) => x.slice(1, -1));
      if (!parts) continue;
      parts.shift(); // remove 'filter'

      this.insertCondition(root, parts, rawValue);
    }

    return root;
  }
  private insertCondition(obj: any, parts: string[], rawValue: any) {
    const part = parts.shift();
    if (!part) return;

    if (part === "or" || part === "and") {
      const next = parts.shift()!;
      if (next && !isNaN(Number(next))) {
        const index = Number(next);
        obj[part.toUpperCase()] ??= [];
        obj[part.toUpperCase()][index] ??= {};
        this.insertCondition(obj[part.toUpperCase()][index], parts, rawValue);
      } else {
        obj[part.toUpperCase()] ??= [];
        obj[part.toUpperCase()].push({});
        this.insertCondition(
          obj[part.toUpperCase()][obj[part.toUpperCase()].length - 1],
          [next, ...parts],
          rawValue
        );
      }
    } else {
      const field = part;
      const op = parts.shift();
      const prismaOp = operatorMap[op ?? ""];
      if (!prismaOp) return;

      let mode: "insensitive" | undefined;
      const maybeMode = parts.shift();

      if (maybeMode === "in") {
        mode = "insensitive";
      } else if (maybeMode === "se") {
        mode = undefined;
      } else if (maybeMode) {
        parts.unshift(maybeMode);
      }

      let value = this.parseValue(rawValue);

      if (prismaOp === "in" || prismaOp === "notIn") {
        value = String(value)
          .split(",")
          .map((v) => this.parseValue(v));
      }

      const condition: any = { [prismaOp]: value };

      if (
        mode === "insensitive" &&
        ["equals", "contains", "startsWith", "endsWith"].includes(prismaOp)
      ) {
        condition.mode = "insensitive";
      }

      if (prismaOp === "equals" && !condition.mode) {
        obj[field] = value;
      } else {
        obj[field] ??= {};
        obj[field][prismaOp] = value;
        if (condition.mode) obj[field].mode = condition.mode;
      }
    }
  }
}
