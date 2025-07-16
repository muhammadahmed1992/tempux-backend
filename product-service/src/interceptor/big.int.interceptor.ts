import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.replaceBigInts(data)));
  }

  private replaceBigInts(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((i) => this.replaceBigInts(i));
    } else if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        acc[key] =
          typeof value === "bigint"
            ? value.toString()
            : this.replaceBigInts(value);
        return acc;
      }, {} as Record<string, any>);
    }
    return obj;
  }
}
