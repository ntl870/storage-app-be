import { Module } from '@nestjs/common';
import { StripePaymentService } from './stripe-payment.service';
import { StripePaymentResolver } from './stripe-payment.resolover';
import { UserModule } from '@modules/user/user.module';
import { PackagesModule } from '@modules/packages/packages.module';

@Module({
  imports: [UserModule, PackagesModule],
  providers: [StripePaymentService, StripePaymentResolver],
  exports: [StripePaymentService],
})
export class StripePaymentModule {}
