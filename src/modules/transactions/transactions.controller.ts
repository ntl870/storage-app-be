import { Controller, Get, Param, Redirect, Req, Res } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('/success/:checkoutId')
  @Redirect('http://localhost:3000/transactions/success', 302)
  async transactionSuccess(@Param('checkoutId') checkoutId: string) {
    return await this.transactionsService.getTransactionByCheckoutId(
      checkoutId,
    );
  }
}
