// >> this entire file needs to be in a library to us to use in the future projects. 
// >> apiVersion can come from evn
// >> currency can be accepted and proper calculation can be done based on country.


import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});
export async function createStripSubscription(scid: string,
  pm: string,
  spid: string,
  amt: number): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: scid,
    items: [
      {
        price_data: {
          currency: 'usd',
          product: spid,
          unit_amount: Math.round(amt * 100),
          recurring: {
            interval: 'month',
          },
        },
      },
    ],
    default_payment_method: pm,
  });
}
export async function cancelStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId);
}
export async function createStripSubscriptionWithTrial(scid: string,
  pm: string,
  spid: string,
  amt: number,
  trialEnd: number): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: scid,
    items: [
      {
        price_data: {
          currency: 'usd',
          product: spid,
          unit_amount: Math.round(amt * 100),
          recurring: {
            interval: 'month',
          },
        },
      },
    ],
    default_payment_method: pm,
    trial_end: trialEnd
  });
}
export async function createStripePaymentWithoutRedirect(stripeCustomerId: string, paymentMethodToUse: string, spid: string, amt: number): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: Math.round(amt * 100),
    currency: 'usd',
    customer: stripeCustomerId,
    payment_method: paymentMethodToUse,
    confirm: true,
    description: `One-time program payment for product ${spid}`,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
  });
}
export async function createStripePayment(stripeCustomerId: string, paymentMethodToUse: string, spid: string, amt: number): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: Math.round(amt * 100),
    currency: 'usd',
    customer: stripeCustomerId,
    payment_method: paymentMethodToUse,
    confirm: true,
    description: `One-time program payment for product ${spid}`,
  });
}
export async function createStripeCustomer(email: string, name: string, paymentMethodId?: string): Promise<Stripe.Customer> {

  interface ClientData {
    email: string;
    name: string;
    payment_method?: string;
  }
  const data: ClientData = {
    email,
    name
  }
  if (paymentMethodId)
    data["payment_method"] = paymentMethodId;
  return await stripe.customers.create(data);
}
export async function attachedNewPaymentToClientAccount(stripeCustomerId: string, paymentMethodId: string) {
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: stripeCustomerId,
  });
}
export async function detachPaymentMethod(paymentMethodId: string) {
  await stripe.paymentMethods.detach(paymentMethodId);
}
export async function isPaymentMethodAlreadyAttached(stripeCustomerId: string, paymentMethodId: string): Promise<boolean> {
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  return paymentMethod.customer === stripeCustomerId;
}
export async function getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.retrieve(paymentMethodId);
}
export async function setCustomerDefaultPaymentMethod(stripeCustomerId: string, paymentMethodId: string) {
  await stripe.customers.update(stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId }
  });
}