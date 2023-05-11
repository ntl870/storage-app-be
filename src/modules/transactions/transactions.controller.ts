import { Controller, Get, Param, Redirect, Req, Res } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { getEnvVar } from '@utils/tools';
import { EnvVar } from 'src/types';

@Controller('/api/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('/success/:checkoutId')
  @Redirect(`${getEnvVar(EnvVar.FRONT_END_URL)}/transaction-success`, 302)
  async transactionSuccess(@Param('checkoutId') checkoutId: string) {
    return await this.transactionsService.getTransactionByCheckoutId(
      checkoutId,
    );
  }
}
