import { forwardRef, Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FilesResolver } from './files.resolver';
import { FoldersModule } from '@modules/folders/folders.module';
import { UserModule } from '@modules/user/user.module';
import { MailModule } from '@modules/mail/mail.module';

@Module({
  imports: [
    forwardRef(() => FoldersModule),
    forwardRef(() => UserModule),
    MailModule,
  ],
  providers: [FilesService, FilesResolver],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
