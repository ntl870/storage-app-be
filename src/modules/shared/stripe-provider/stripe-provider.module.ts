import { Global, Module } from '@nestjs/common';
import { StripeProvider } from './stripe.provider';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [...StripeProvider],
  exports: [...StripeProvider],
})
export class StripeProviderModule {}
