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

    const { page, pageSize, sortBy, sortDir, select, filter, ...rest } = value;

    const transformed: TransformedQuery = {
      page: parseInt(page || "1", 10), // Default to page 1
      pageSize: parseInt(pageSize || "10", 10), // Default to pageSize 10
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
        parsedFilter = filter;
      } else {
        throw new BadRequestException(
          "Validation failed: Filter parameter must be a JSON string or an object."
        );
      }

      // Apply transformations to the parsed filter object
      // Convert "true"/"false" strings to booleans
      if (typeof parsedFilter.is_deleted === "string") {
        if (parsedFilter.is_deleted === "true") {
          parsedFilter.is_deleted = true;
        } else if (parsedFilter.is_deleted === "false") {
          parsedFilter.is_deleted = false;
        } else {
          // Optional: throw error for invalid boolean string
          // throw new BadRequestException('Validation failed: isActive must be "true" or "false".');
        }
      }

      // Split comma-separated strings in 'role.in'
      // This assumes a structure like { role: { in: "admin,user" } }
      if (parsedFilter.role && typeof parsedFilter.role.in === "string") {
        parsedFilter.role.in = parsedFilter.role.in
          .split(",")
          .map((s: string) => s.trim());
      }
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
}
