import { STRIPE_PROVIDER } from '@modules/shared/stripe-provider/constants/stripe-provider.constants';
import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class TransactionsService {
  constructor(@Inject(STRIPE_PROVIDER) private readonly stripe: Stripe) {}
  async getTransactionByCheckoutId(checkoutId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(checkoutId);
    console.log(session);
  }
}
