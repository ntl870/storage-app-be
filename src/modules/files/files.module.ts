import { forwardRef, Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FilesResolver } from './files.resolver';
import { FoldersModule } from '@modules/folders/folders.module';

@Module({
  imports: [forwardRef(() => FoldersModule)],
  providers: [FilesService, FilesResolver],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
