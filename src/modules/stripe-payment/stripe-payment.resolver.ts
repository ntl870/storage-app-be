import { ParseIntPipe, UseGuards } from '@nestjs/common';
import { StripePaymentService } from './stripe-payment.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '@decorators/CurrentUser';
import { User } from '@modules/user/user.entity';

@Resolver()
export class StripePaymentResolver {
  constructor(private readonly stripePaymentService: StripePaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async createCheckoutSession(
    @CurrentUser() user: User,
    @Args('packageId', ParseIntPipe) packageId: number,
  ) {
    return await this.stripePaymentService.createCheckoutSession(
      packageId,
      +user.ID,
    );
  }
}
