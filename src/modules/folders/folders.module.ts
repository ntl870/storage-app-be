import { forwardRef, Module } from '@nestjs/common';
import { FoldersResolver } from './folders.resolver';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { FilesModule } from '@modules/files/files.module';
import { UserModule } from '@modules/user/user.module';
import { MailModule } from '@modules/mail/mail.module';

@Module({
  imports: [
    forwardRef(() => FilesModule),
    forwardRef(() => UserModule),
    MailModule,
  ],
  providers: [FoldersService, FoldersResolver],
  controllers: [FoldersController],
  exports: [FoldersService],
})
export class FoldersModule {}
