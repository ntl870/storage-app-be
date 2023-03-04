import { FilesService } from '@modules/files/files.service';
import { Module } from '@nestjs/common';
import { FoldersResolver } from './folders.resolver';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';

@Module({
  providers: [FoldersService, FoldersResolver, FilesService],
  exports: [FoldersService],
  controllers: [FoldersController],
})
export class FoldersModule {}
