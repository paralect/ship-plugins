import { z } from 'zod';

import { subscriptionSchema } from '../subscriptions/subscription.schema';

export const userStripeExtend = {
  stripeId: z.string().optional().nullable(),
  subscription: subscriptionSchema.optional().nullable(),
};
