import { FilesModule } from '@modules/files/files.module';
import { FoldersModule } from '@modules/folders/folders.module';
import { Module, forwardRef } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { PackagesModule } from '@modules/packages/packages.module';
import { ComputersModule } from '../computers/computers.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    forwardRef(() => FoldersModule),
    forwardRef(() => FilesModule),
    forwardRef(() => PackagesModule),
    forwardRef(() => ComputersModule),
    forwardRef(() => TransactionsModule),
  ],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
