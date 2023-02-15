import { FilesModule } from '@modules/files/files.module';
import { forwardRef, Module } from '@nestjs/common';
import { FoldersResolver } from './folders.resolver';
import { FoldersService } from './folders.service';

@Module({
  imports: [forwardRef(() => FilesModule)],
  providers: [FoldersService, FoldersResolver],
  exports: [FoldersService],
})
export class FoldersModule {}
