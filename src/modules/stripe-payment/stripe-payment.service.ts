import { PackagesService } from '@modules/packages/packages.service';
import { STRIPE_PROVIDER } from '@modules/shared/stripe-provider/constants/stripe-provider.constants';
import { UserService } from '@modules/user/user.service';
import { Inject, Injectable } from '@nestjs/common';
import { getEnvVar } from '@utils/tools';
import { EnvVar, TRANSACTION_STATUS } from 'src/types';
import Stripe from 'stripe';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class StripePaymentService {
  constructor(
    @Inject(STRIPE_PROVIDER) private readonly stripe: Stripe,
    private readonly userService: UserService,
    private readonly packagesService: PackagesService,
    private readonly transactionService: TransactionsService,
  ) {}

  async createCheckoutSession(packageId: number, userId: number) {
    const user = await this.userService.getOneByID(userId.toString());
    if (!user) {
      throw new Error('User not found');
    }

    if (user.currentPackage.ID >= packageId) {
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
    const transaction =
      await this.transactionService.transactionRepository.save({
        userId: user.ID.toString(),
        packageId: packageData.ID,
        status: TRANSACTION_STATUS.PENDING,
        amount: packageData.price,
      });
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
      success_url: `${getEnvVar(EnvVar.FRONT_END_URL)}/transaction-success`,
      cancel_url: `${getEnvVar(EnvVar.FRONT_END_URL)}/buy-storage`,
      metadata: {
        userId: user.ID,
        packageId,
        packageName: packageData.name,
        transactionId: transaction.ID,
      },
    });

    return session.url;
  }

  async fulFillCheckoutSession(webhookData: any) {
    const session = webhookData.data.object;
    const user = await this.userService.getOneByID(session.metadata.userId);
    const pkg = await this.packagesService.getPackageByID(
      Number(session.metadata.packageId),
    );
    user.currentPackage = pkg;
    await user.save();
    const transaction =
      await this.transactionService.transactionRepository.findOne({
        where: {
          ID: session.metadata.transactionId,
        },
      });
    transaction.status = TRANSACTION_STATUS.SUCCESS;
    transaction.stripeTransactionId = session.payment_intent;
    await transaction.save();
  }

  async rejectPaymentIntent(webhookData: any) {
    const session = webhookData.data.object;
    const transaction =
      await this.transactionService.transactionRepository.findOne({
        where: {
          ID: session.metadata.transactionId,
        },
      });
    transaction.status = TRANSACTION_STATUS.FAILED;
    await transaction.save();
  }
}
