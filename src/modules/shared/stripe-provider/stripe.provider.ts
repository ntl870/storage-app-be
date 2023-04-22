import { Provider } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_PROVIDER } from './constants/stripe-provider.constants';
import { getEnvVar } from '@utils/tools';
import { EnvVar } from 'src/types';

export const StripeProvider: Provider[] = [
  {
    useFactory: () => {
      return new Stripe(getEnvVar(EnvVar.STRIPE_SECRET_KEY), {
        apiVersion: '2022-11-15',
      });
    },
    provide: STRIPE_PROVIDER,
  },
];
