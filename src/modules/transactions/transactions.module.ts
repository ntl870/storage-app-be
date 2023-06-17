import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { UserModule } from '@modules/user/user.module';
import { PackagesModule } from '@modules/packages/packages.module';
import { TransactionsResolver } from './transactions.resolver';

@Module({
  imports: [UserModule, PackagesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsResolver],
  exports: [TransactionsService],
})
export class TransactionsModule {}
