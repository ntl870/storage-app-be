import { HttpException, HttpStatus } from '@nestjs/common';

export class ErrorException {
  static unAuthorized(message: string) {
    return new HttpException(message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message: string) {
    return new HttpException(message, HttpStatus.FORBIDDEN);
  }

  static badRequest(message: string) {
    return new HttpException(message, HttpStatus.BAD_REQUEST);
  }
}
