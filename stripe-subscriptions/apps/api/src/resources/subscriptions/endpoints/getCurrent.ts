import Stripe from 'stripe';

import { userService } from 'resources/users';

import stripeService from 'services/stripe/stripe.service';
import createEndpoint from 'routes/createEndpoint';

export default createEndpoint({
  method: 'get',
  path: '/current',

  async handler(ctx) {
    const { user } = ctx.state;

    if (!user.subscription) {
      // Handle race condition: checkout redirect can arrive before the webhook
      // writes the subscription. If user has a stripeId, check Stripe directly.
      if (!user.stripeId) {
        return null;
      }

      const subscriptions = await stripeService.subscriptions.list({
        customer: user.stripeId,
        status: 'active',
        limit: 1,
      });

      const activeSub = subscriptions.data[0];

      if (!activeSub) {
        return null;
      }

      const item = activeSub.items.data[0];
      const period = stripeService.getSubscriptionPeriod(activeSub);

      const subscription = {
        subscriptionId: activeSub.id,
        priceId: item.price.id,
        productId: item.price.product as string,
        status: activeSub.status,
        interval: item.price.recurring?.interval ?? 'month',
        ...period,
        cancelAtPeriodEnd: activeSub.cancel_at_period_end,
      };

      await userService.atomic.updateOne({ _id: user._id }, { $set: { subscription } });
      user.subscription = subscription;
    }

    const stripeSubscription = (await stripeService.subscriptions.retrieve(
      user.subscription.subscriptionId,
    )) as Stripe.Subscription;

    if (stripeSubscription.status === 'canceled') {
      await userService.atomic.updateOne({ _id: user._id }, { $unset: { subscription: '' } });
      return null;
    }

    const isCanceled = stripeSubscription.cancel_at_period_end || stripeSubscription.cancel_at !== null;
    const period = stripeService.getSubscriptionPeriod(stripeSubscription);
    const currentPeriodEnd = stripeSubscription.cancel_at ?? period.currentPeriodEndDate;
    const currentPriceId = stripeSubscription.items.data[0]?.price.id ?? user.subscription.priceId;

    const needsUpdate =
      user.subscription.cancelAtPeriodEnd !== isCanceled ||
      user.subscription.status !== stripeSubscription.status ||
      user.subscription.priceId !== currentPriceId ||
      user.subscription.currentPeriodEndDate !== currentPeriodEnd;

    if (needsUpdate) {
      const updatedSubscription = {
        ...user.subscription,
        priceId: currentPriceId,
        cancelAtPeriodEnd: isCanceled,
        status: stripeSubscription.status,
        currentPeriodStartDate: period.currentPeriodStartDate,
        currentPeriodEndDate: currentPeriodEnd,
      };

      await userService.atomic.updateOne({ _id: user._id }, { $set: { subscription: updatedSubscription } });
      user.subscription = updatedSubscription;
    }

    const product = await stripeService.products.retrieve(user.subscription.productId);

    return {
      ...user.subscription,
      product: {
        name: product.name,
        images: product.images,
      },
    };
  },
});
