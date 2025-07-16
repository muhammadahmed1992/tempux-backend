import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class QueryParserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const query = request.query;

    // Parse select
    if (query.select) {
      query._select = query.select.split(",").reduce((acc: any, key: any) => {
        acc[key] = true;
        return acc;
      }, {});
    }

    // Parse filter
    if (query.filter) {
      const filter = query.filter;

      if (filter.isActive === "true") filter.isActive = true;
      if (filter.isActive === "false") filter.isActive = false;

      if (filter?.role?.in) {
        filter.role.in = filter.role.in.split(",");
      }

      query._filter = filter;
    }

    return next.handle();
  }
}
