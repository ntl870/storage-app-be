import { FilesService } from '@modules/files/files.service';
import { Module } from '@nestjs/common';
import { FoldersResolver } from './folders.resolver';
import { FoldersService } from './folders.service';

@Module({
  providers: [FoldersService, FoldersResolver, FilesService],
  exports: [FoldersService],
})
export class FoldersModule {}
