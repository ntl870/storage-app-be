import { PackagesService } from '@modules/packages/packages.service';
import { STRIPE_PROVIDER } from '@modules/shared/stripe-provider/constants/stripe-provider.constants';
import { UserService } from '@modules/user/user.service';
import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { getRepository } from '../../db/db';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  public transactionRepository: Repository<Transaction>;
  constructor(
    @Inject(STRIPE_PROVIDER) private readonly stripe: Stripe,
    private readonly userService: UserService,
    private readonly packagesService: PackagesService,
  ) {
    this.transactionRepository = getRepository(Transaction);
  }

  async getTransactionByCheckoutId(checkoutId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(checkoutId);
    if (session.payment_status === 'paid' && session.status === 'complete') {
      const user = await this.userService.getOneByID(session.metadata.userId);
      const pkg = await this.packagesService.getPackageByID(
        Number(session.metadata.packageId),
      );
      user.currentPackage = pkg;
      await user.save();
      return;
    }
  }
}
