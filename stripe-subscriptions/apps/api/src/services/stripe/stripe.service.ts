import { ClientSession } from '@paralect/node-mongo';
import Stripe from 'stripe';

import { userService } from 'resources/users';

import type { User } from 'shared';

import stripeConfig from 'config/stripe.config';

import logger from 'logger';

const stripe = stripeConfig.STRIPE_SECRET_KEY ? new Stripe(stripeConfig.STRIPE_SECRET_KEY) : null;

const createCustomer = async (user: User, session?: ClientSession): Promise<string | null> => {
  if (!stripe) {
    logger.warn('[Stripe] Service not initialized - STRIPE_SECRET_KEY not provided');
    return null;
  }

  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    });

    await userService.atomic.updateOne(
      { _id: user._id },
      {
        $set: {
          stripeId: customer.id,
        },
      },
      {},
      { session },
    );

    logger.info(`[Stripe] Created customer ${customer.id} for user ${user._id}`);

    return customer.id;
  } catch (error) {
    logger.error(`[Stripe] Error creating customer for user ${user._id}`, error);
    throw error;
  }
};

const getStripe = () => {
  if (!stripe) {
    throw new Error('[Stripe] Service not initialized - STRIPE_SECRET_KEY not provided');
  }
  return stripe;
};

/**
 * Stripe SDK v20+ removed current_period_start/current_period_end from
 * the Subscription type, but the API still returns them.
 * This helper extracts them in one place so consumers stay clean.
 */
const getSubscriptionPeriod = (sub: Stripe.Subscription) => {
  const raw = sub as unknown as { current_period_start: number; current_period_end: number };
  return {
    currentPeriodStartDate: raw.current_period_start,
    currentPeriodEndDate: raw.current_period_end,
  };
};

export default {
  createCustomer,
  getStripe,
  getSubscriptionPeriod,
  get subscriptions() {
    return getStripe().subscriptions;
  },
  get customers() {
    return getStripe().customers;
  },
  get checkout() {
    return getStripe().checkout;
  },
  get billingPortal() {
    return getStripe().billingPortal;
  },
  get products() {
    return getStripe().products;
  },
  get invoices() {
    return getStripe().invoices;
  },
  get webhooks() {
    return getStripe().webhooks;
  },
};
