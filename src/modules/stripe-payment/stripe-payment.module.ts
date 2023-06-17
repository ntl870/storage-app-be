import { Module } from '@nestjs/common';
import { StripePaymentService } from './stripe-payment.service';
import { StripePaymentResolver } from './stripe-payment.resolver';
import { UserModule } from '@modules/user/user.module';
import { PackagesModule } from '@modules/packages/packages.module';
import { StripeWebhookController } from './stripe-webhook.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [UserModule, PackagesModule, TransactionsModule],
  controllers: [StripeWebhookController],
  providers: [StripePaymentService, StripePaymentResolver],
  exports: [StripePaymentService],
})
export class StripePaymentModule {}
