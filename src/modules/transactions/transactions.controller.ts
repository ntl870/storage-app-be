import { Controller, Get, Param, Req } from '@nestjs/common';
import stripe from 'stripe';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}
  @Get('/success/:checkoutId')
  async transactionSuccess(@Param('checkoutId') checkoutId: string) {
    return await this.transactionsService.getTransactionByCheckoutId(
      checkoutId,
    );
  }
}
