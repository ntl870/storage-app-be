import { PackagesService } from '@modules/packages/packages.service';
import { STRIPE_PROVIDER } from '@modules/shared/stripe-provider/constants/stripe-provider.constants';
import { UserService } from '@modules/user/user.service';
import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import * as _ from 'lodash';
import { DB } from '../../db/db';
import { Transaction } from './entities/transaction.entity';
import { StatisticTransaction } from './transactions.types';

@Injectable()
export class TransactionsService {
  public transactionRepository: Repository<Transaction>;
  constructor(
    @Inject(STRIPE_PROVIDER) private readonly stripe: Stripe,
    private readonly userService: UserService,
    private readonly packagesService: PackagesService,
  ) {
    this.transactionRepository = DB.getInstance().getRepository(Transaction);
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

  async getStatisticTransactions(
    dateFrom: string,
    dateTo: string,
  ): Promise<StatisticTransaction[]> {
    //check if dateTo - dateFrom > 45 days, group by date, else group by month
    const diffDay = moment
      .duration(moment(dateTo).diff(moment(dateFrom)))
      .asDays();
    let groupBy = 'YYYY-MM-DD';
    if (diffDay > 45) {
      groupBy = 'YYYY-MM';
    }
    // Define an array with value 0
    const startAt = moment(dateFrom)
      .startOf('day')
      .format('YYYY-MM-DD HH:mm:ss');
    const endAt = moment(dateTo).endOf('day').format('YYYY-MM-DD HH:mm:ss');
    let arr = [];
    if (groupBy === 'YYYY-MM-DD') {
      while (moment(dateFrom).isSameOrBefore(dateTo)) {
        arr.push({
          date: moment(dateFrom).format('YYYY-MM-DD'),
          amount: 0,
        });
        dateFrom = moment(dateFrom).add(1, 'days').format('YYYY-MM-DD');
      }
    }
    if (groupBy === 'YYYY-MM') {
      while (moment(dateFrom).isSameOrBefore(dateTo)) {
        arr.push({
          date: moment(dateFrom).format('YYYY-MM'),
          amount: 0,
        });
        dateFrom = moment(dateFrom).add(1, 'months').format('YYYY-MM');
      }
    }

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(`TO_CHAR(transaction.createdDate, '${groupBy}')`, 'date')
      .addSelect('CAST(SUM(transaction.amount) AS INTEGER)', 'amount')
      .groupBy(`TO_CHAR(transaction.createdDate, '${groupBy}')`)
      .orderBy(`TO_CHAR(transaction.createdDate, '${groupBy}')`, 'ASC');

    if (startAt && endAt) {
      transactions.andWhere('transaction.createdDate >= :dateFrom', {
        dateFrom: startAt,
      });
      transactions.andWhere('transaction.createdDate <= :dateTo', {
        dateTo: endAt,
      });
    }

    const data = await transactions.getRawMany();
    const transactionAsSet = _.keyBy(data, 'date');
    arr = arr.map((item) => {
      if (transactionAsSet[item.date]) {
        return transactionAsSet[item.date];
      }
      return item;
    });

    return arr;
  }
}
