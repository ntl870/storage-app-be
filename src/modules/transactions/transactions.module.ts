import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { UserModule } from '@modules/user/user.module';
import { PackagesModule } from '@modules/packages/packages.module';

@Module({
  imports: [UserModule, PackagesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
