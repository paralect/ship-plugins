const stripeConfig = {
  STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
  PRICE_CREATOR: process.env.NEXT_PUBLIC_PRICE_CREATOR || '',
  PRICE_PRO: process.env.NEXT_PUBLIC_PRICE_PRO || '',
};

export default stripeConfig;
