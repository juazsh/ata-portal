import { Response } from 'express';
import User from '../../models/user';
import Enrollment from '../../models/enrollment';
import Payment from '../../models/payment';
import { createStripSubscription, createStripePayment, stripe } from './stripe-client';


export const processGuestStripePayment = async (payment: any) : Promise<any> => {
  const {stripeCustomerId, stripePaymentMethodId, stripeProductId, offeringType, amount } = payment;
  if (offeringType === 'Marathon') {
    const subscription = await createStripSubscription(stripeCustomerId, stripePaymentMethodId, stripeProductId, amount);
    return {stripeSubscriptionId: subscription.id, stripeTransactionId: subscription.latest_invoice as string};
  }
  createStripePayment(stripeCustomerId, stripePaymentMethodId, stripeProductId, amount);
  return;
}


export const processStripePayment = async (user: any, enrollment: any, paymentMethodId: string, res: Response) => {
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    });
    stripeCustomerId = customer.id;
    await User.findByIdAndUpdate(user._id, { stripeCustomerId });
  }

  const payment = await Payment.findById(paymentMethodId);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment method not found'
    });
  }

  const paymentMethodToUse = payment.stripePaymentMethodId;

  if (!paymentMethodToUse) {
    return res.status(400).json({
      success: false,
      message: 'No Stripe payment method available'
    });
  }

  if (enrollment.offeringType === 'Marathon') {
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price_data: {
            currency: 'usd',
            product: 'prod_SBGrHDgAI2y5rf',
            unit_amount: Math.round(enrollment.monthlyAmount * 100),
            recurring: {
              interval: 'month',
            },
          },
        },
      ],
      default_payment_method: paymentMethodToUse,
    });

    const nextPaymentDue = new Date();
    nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
    const paymentRecord = {
      amount: enrollment.totalAmount,
      date: new Date(),
      status: 'completed',
      processor: 'stripe',
      transactionId: subscription.latest_invoice as string
    };

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollment._id,
      {
        $push: { paymentHistory: paymentRecord },
        $set: {
          subscriptionId: subscription.id,
          nextPaymentDue: nextPaymentDue,
          paymentStatus: 'active',
          paymentProcessor: 'stripe'
        }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Your payment was successful',
      enrollment: updatedEnrollment
    });
  } else {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(enrollment.totalAmount * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodToUse,
      confirm: true,
      description: 'One-time program payment',
    });

    const paymentRecord = {
      amount: enrollment.totalAmount,
      date: new Date(),
      status: 'completed',
      processor: 'stripe',
      transactionId: paymentIntent.id
    };

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollment._id,
      {
        $push: { paymentHistory: paymentRecord },
        $set: {
          paymentStatus: 'completed',
          paymentDate: new Date(),
          paymentTransactionId: paymentIntent.id,
          paymentProcessor: 'stripe'
        }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Stripe payment processed successfully',
      enrollment: updatedEnrollment
    });
  }
};