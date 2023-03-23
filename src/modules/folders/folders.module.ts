import { forwardRef, Module } from '@nestjs/common';
import { FoldersResolver } from './folders.resolver';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { FilesModule } from '@modules/files/files.module';

@Module({
  imports: [forwardRef(() => FilesModule)],
  providers: [FoldersService, FoldersResolver],
  controllers: [FoldersController],
  exports: [FoldersService],
})
export class FoldersModule {}
