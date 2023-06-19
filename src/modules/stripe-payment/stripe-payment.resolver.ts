import { CurrentUser } from '@decorators/CurrentUser';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { User } from '@modules/user/user.entity';
import { ParseIntPipe, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { StripePaymentService } from './stripe-payment.service';

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
