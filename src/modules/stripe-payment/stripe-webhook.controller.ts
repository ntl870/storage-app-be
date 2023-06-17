import { Body, Controller, Post, Req } from '@nestjs/common';
import { StripePaymentService } from './stripe-payment.service';

@Controller('stripe-webhook')
export class StripeWebhookController {
  constructor(
    private readonly stripePaymentService: StripePaymentService,
  ) {}

  @Post()
  async stripeWebhook(
    @Body() body: any,
  ) {
    console.log('stripe-webhook.controller.ts: ', body);
    switch (body.type) {
      case 'checkout.session.completed': {
        return this.stripePaymentService.fulFillCheckoutSession(body);
      }
      case 'payment_intent.payment_failed': {
        return this.stripePaymentService.rejectPaymentIntent(body);
      }
      default: {
        return;
      }
    }
  }
}