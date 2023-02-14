import { Module } from '@nestjs/common';
import { FoldersResolver } from './folders.resolver';
import { FoldersService } from './folders.service';

@Module({
  providers: [FoldersService, FoldersResolver],
  exports: [FoldersService],
})
export class FoldersModule {}
