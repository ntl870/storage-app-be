import { PackagesService } from '@modules/packages/packages.service';
import { STRIPE_PROVIDER } from '@modules/shared/stripe-provider/constants/stripe-provider.constants';
import { UserService } from '@modules/user/user.service';
import { Inject, Injectable } from '@nestjs/common';
import { getEnvVar } from '@utils/tools';
import { EnvVar } from 'src/types';
import Stripe from 'stripe';

@Injectable()
export class StripePaymentService {
  constructor(
    @Inject(STRIPE_PROVIDER) private readonly stripe: Stripe,
    private readonly userService: UserService,
    private readonly packagesService: PackagesService,
  ) {}

  async createCheckoutSession(packageId: number, userId: number) {
    const user = await this.userService.getOneByID(userId.toString());
    if (!user) {
      throw new Error('User not found');
    }

    if (user.currentPackage >= packageId) {
      throw new Error('Cannot downgrade package');
    }

    const packageData = await this.packagesService.packageRepository.findOne({
      where: {
        ID: packageId,
      },
    });

    if (!packageData) {
      throw new Error('Package not found');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: packageData.name,
            },
            unit_amount: packageData.price * 100,
          },
          quantity: 1,
        },
      ],
      customer: user.stripeCustomerID,
      mode: 'payment',
      success_url: `${getEnvVar(
        EnvVar.CLIENT_URL,
      )}/transactions/success/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${getEnvVar(EnvVar.CLIENT_URL)}/cancel`,
      metadata: {
        userId: user.ID,
        packageId,
        packageName: packageData.name,
      },
    });

    return session.url;
  }
}
