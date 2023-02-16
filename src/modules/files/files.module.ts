import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FilesResolver } from './files.resolver';
import { FoldersService } from '@modules/folders/folders.service';

@Module({
  providers: [FilesService, FilesResolver, FoldersService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
