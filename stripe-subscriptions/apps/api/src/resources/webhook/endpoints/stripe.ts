import Stripe from 'stripe';

import { userService } from 'resources/users';

import isPublic from 'middlewares/isPublic';
import stripeService from 'services/stripe/stripe.service';
import createEndpoint from 'routes/createEndpoint';

import stripeConfig from 'config/stripe.config';

import logger from 'logger';

const updateUserSubscription = async (sub: Stripe.Subscription) => {
  const isCanceled = sub.cancel_at_period_end || sub.cancel_at !== null;
  const item = sub.items.data[0];
  const period = stripeService.getSubscriptionPeriod(sub);

  const subscription = {
    subscriptionId: sub.id,
    priceId: item.price.id,
    productId: item.price.product as string,
    status: sub.status,
    interval: item.price.recurring?.interval ?? 'month',
    ...period,
    cancelAtPeriodEnd: isCanceled,
  };

  return userService.atomic.updateOne({ stripeId: sub.customer as string }, { $set: { subscription } });
};

const deleteUserSubscription = async (customerId: string) => {
  return userService.atomic.updateOne({ stripeId: customerId }, { $unset: { subscription: '' } });
};

export default createEndpoint({
  method: 'post' as const,
  path: '/stripe',
  middlewares: [isPublic],
  handler: async (ctx) => {
    const signature = ctx.request.header['stripe-signature'];

    if (!signature) {
      return ctx.throwError('Stripe signature header is missing');
    }

    if (!stripeConfig.STRIPE_WEBHOOK_SECRET) {
      return ctx.throwError('Stripe webhook secret is not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripeService.webhooks.constructEvent(
        (ctx.request as unknown as { rawBody: string }).rawBody,
        signature,
        stripeConfig.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      return ctx.throwError(`Webhook signature verification failed: ${err}`);
    }

    const sub = event.data.object as Stripe.Subscription;

    switch (event.type) {
      case 'customer.subscription.created':
        await updateUserSubscription(sub);
        logger.info(`Subscription created for customer ${sub.customer}`);
        break;

      case 'customer.subscription.updated':
        await updateUserSubscription(sub);
        logger.info(`Subscription updated for customer ${sub.customer}`);
        break;

      case 'customer.subscription.deleted':
        await deleteUserSubscription(sub.customer as string);
        logger.info(`Subscription deleted for customer ${sub.customer}`);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  },
});
