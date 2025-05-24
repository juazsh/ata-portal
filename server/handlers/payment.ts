import { Request, Response } from 'express';
import Stripe from 'stripe';
import Payment from '../models/payment';
import User from '../models/user';
import { UserRole } from '../models/user';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

export const addPayment = async (req: Request, res: Response) => {
  try {
    const { paymentMethodId, userId } = req.body;

    if (!paymentMethodId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.id !== userId &&
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.OWNER) {
      return res.status(403).json({ message: 'Not authorized to add payment methods for this user' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      return res.status(403).json({ message: 'Only parents, admins, or owners can add payment methods' });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.type !== 'card' || !paymentMethod.card) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        payment_method: paymentMethodId,
      });

      stripeCustomerId = customer.id;

      await User.findByIdAndUpdate(userId, { stripeCustomerId });
    } else {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
    }

    const existingPayments = await Payment.countDocuments({ userId });
    const isDefault = existingPayments === 0;

    const payment = new Payment({
      userId,
      last4: paymentMethod.card.last4,
      expirationDate: `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`,
      cardType: paymentMethod.card.brand,
      isDefault,
      stripePaymentMethodId: paymentMethodId
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment method added successfully',
      payment: {
        id: payment._id,
        last4: payment.last4,
        expirationDate: payment.expirationDate,
        cardType: payment.cardType,
        isDefault: payment.isDefault
      }
    });
  } catch (error) {
    console.error('Failed to add payment method:', error);
    res.status(500).json({ message: 'Failed to add payment method' });
  }
};

export const removePayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    if (req.user.id !== payment.userId.toString() &&
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.OWNER) {
      return res.status(403).json({ message: 'Not authorized to remove this payment method' });
    }

    const user = await User.findById(payment.userId);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ message: 'User or Stripe customer not found' });
    }

    await stripe.paymentMethods.detach(payment.stripePaymentMethodId);

    if (payment.isDefault) {
      const anotherPayment = await Payment.findOne({
        userId: payment.userId,
        _id: { $ne: paymentId }
      });

      if (anotherPayment) {
        await Payment.findByIdAndUpdate(anotherPayment._id, { isDefault: true });
      }
    }

    await Payment.findByIdAndDelete(paymentId);

    res.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    console.error('Failed to remove payment method:', error);
    res.status(500).json({ message: 'Failed to remove payment method' });
  }
};

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    console.dir(req.user);
    if (req.user.id !== userId &&
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.OWNER) {
      return res.status(403).json({ message: 'Not authorized to view payment methods for this user' });
    }

    const payments = await Payment.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

    res.json(payments.map(payment => ({
      id: payment._id,
      last4: payment.last4,
      cardholderName: req.user.firstName + ' ' + req.user.lastName,
      expirationDate: payment.expirationDate,
      cardType: payment.cardType,
      isDefault: payment.isDefault
    })));
  } catch (error) {
    console.error('Failed to get payment methods:', error);
    res.status(500).json({ message: 'Failed to get payment methods' });
  }
};

export const createStripeCustomer = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: 'Missing email or name' });
    }
    const customer = await stripe.customers.create({ email, name });
    res.status(201).json({ customerId: customer.id });
  } catch (error) {
    console.error('Failed to create Stripe customer:', error);
    res.status(500).json({ message: 'Failed to create Stripe customer' });
  }
};