import { Module } from '@nestjs/common';
import { ComputersService } from './computers.service';

@Module({
  providers: [ComputersService],
})
export class ComputersModule {}
