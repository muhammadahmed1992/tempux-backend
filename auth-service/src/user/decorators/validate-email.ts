// src/decorators/validate-unique.decorator.ts
import { HttpStatus } from '@nestjs/common';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { UserService } from '@User/services/user.service';

/**
 * Simple decorator for checking user uniqueness.
 * @param fieldExtractor - function to extract the field value from args
 */
export function ValidateUnique(fieldExtractor?: (args: any[]) => string) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // directly access userRepository
      const service = this as UserService;

      // pick value either from extractor or from dto.email
      const value = fieldExtractor ? fieldExtractor(args) : args[0]?.email;

      const exists = await service.validateUserHelper(value);
      if (!exists) {
        return ResponseHelper.CreateResponse<boolean>(
          Constants.USER_ALREADY_EXISTS,
          false,
          HttpStatus.CONFLICT,
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
