import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { TransactionsService } from './transactions.service';
import { StatisticTransaction } from './transactions.types';

@Resolver()
export class TransactionsResolver {
  constructor (private readonly transactionsService: TransactionsService) {}

  @Query(() => [StatisticTransaction])
  async getStatisticTransactions(
    @Args('dateFrom') dateFrom: string,
    @Args('dateTo') dateTo: string,
  ) {
    return await this.transactionsService.getStatisticTransactions(dateFrom, dateTo);
  }
}