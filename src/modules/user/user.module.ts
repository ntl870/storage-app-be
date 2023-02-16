import { FilesService } from '@modules/files/files.service';
import { FoldersModule } from '@modules/folders/folders.module';
import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [FoldersModule],
  providers: [UserService, UserResolver, FilesService],
  exports: [UserService],
})
export class UserModule {}
