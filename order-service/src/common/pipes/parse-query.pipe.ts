import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ParseQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === undefined || value === null) {
      return value;
    }

    const num = Number(value);
    return isNaN(num) ? value : num;
  }
}
