import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/health')
  getHello(): string {
    return 'Hello World! test 1234';
  }
}
