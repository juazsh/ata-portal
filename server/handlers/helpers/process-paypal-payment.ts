import { Request, Response } from 'express';
import Enrollment from '../../models/enrollment';
import { Program } from '../../models/program';
import { getPayPalAccessToken, createPayPalPlanForProduct, createPayPalProduct } from './paypal-client';
import axios from 'axios';

export const processPayPalPayment = async (user: any, enrollment: any, paymentMethodId: string | null, res: Response) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

    const program = await Program.findById(enrollment.programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    if (!program.paypalProductId) {
      try {
        const productId = await createPayPalProduct(
          program.name,
          `${program.name} - ${program.offering.name} Program`
        );

        await Program.findByIdAndUpdate(program._id, { paypalProductId: productId });
        program.paypalProductId = productId;
      } catch (productError) {
        console.error('Error creating PayPal product:', productError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create PayPal product'
        });
      }
    }

    if (enrollment.offeringType === 'Marathon') {
      let planId;
      try {
        const plansResponse = await axios({
          method: 'get',
          url: `${baseUrl}/v1/billing/plans?product_id=${program.paypalProductId}`,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (plansResponse.data.plans && plansResponse.data.plans.length > 0) {
          planId = plansResponse.data.plans[0].id;
        } else {
          planId = await createPayPalPlanForProduct(
            program.paypalProductId,
            program.name,
            enrollment.totalAmount || enrollment.monthlyAmount
          );
        }
      } catch (planError) {
        console.error('Error finding or creating PayPal plan:', planError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create or find PayPal plan'
        });
      }

      const returnUrl = `${process.env.FRONTEND_URL}/enrollments/success?id=${enrollment._id}`;
      const cancelUrl = `${process.env.FRONTEND_URL}/enrollments/cancel?id=${enrollment._id}`;

      try {
        const subscriptionResponse = await axios({
          method: 'post',
          url: `${baseUrl}/v1/billing/subscriptions`,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `sub-${enrollment._id}-${Date.now()}`
          },
          data: {
            plan_id: planId,
            application_context: {
              brand_name: process.env.BUSINESS_NAME || 'Your Educational Platform',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'SUBSCRIBE_NOW',
              return_url: returnUrl,
              cancel_url: cancelUrl
            }
          }
        });

        await Enrollment.findByIdAndUpdate(
          enrollment._id,
          {
            $set: {
              paymentProcessor: 'paypal',
              paymentStatus: 'pending',
              subscriptionId: subscriptionResponse.data.id
            }
          }
        );

        const approvalUrl = subscriptionResponse.data.links.find(
          (link: any) => link.rel === 'approve'
        )?.href;

        return res.status(200).json({
          success: true,
          message: 'PayPal subscription created. Please approve to complete.',
          approvalUrl: approvalUrl,
          subscriptionId: subscriptionResponse.data.id
        });
      } catch (error) {
        console.error('Error creating PayPal subscription:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create PayPal subscription'
        });
      }
    } else {
      try {
        const returnUrl = `${process.env.FRONTEND_URL}/enrollments/success?id=${enrollment._id}`;
        const cancelUrl = `${process.env.FRONTEND_URL}/enrollments/cancel?id=${enrollment._id}`;

        const orderResponse = await axios({
          method: 'post',
          url: `${baseUrl}/v2/checkout/orders`,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `order-${enrollment._id}-${Date.now()}`
          },
          data: {
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: 'USD',
                  value: (enrollment.totalAmount || program.price).toFixed(2)
                },
                description: `Payment for ${program.name}`
              }
            ],
            application_context: {
              brand_name: process.env.BUSINESS_NAME || 'Your Educational Platform',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW',
              return_url: returnUrl,
              cancel_url: cancelUrl
            }
          }
        });

        await Enrollment.findByIdAndUpdate(
          enrollment._id,
          {
            $set: {
              paymentProcessor: 'paypal',
              paymentStatus: 'pending',
              paymentTransactionId: orderResponse.data.id
            }
          }
        );

        const approvalUrl = orderResponse.data.links.find(
          (link: any) => link.rel === 'approve'
        )?.href;

        return res.status(200).json({
          success: true,
          message: 'PayPal order created. Please approve to complete.',
          approvalUrl: approvalUrl,
          orderId: orderResponse.data.id
        });
      } catch (error) {
        console.error('Error creating PayPal order:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create PayPal order'
        });
      }
    }
  } catch (error) {
    console.error('Error in PayPal payment process:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during PayPal payment processing'
    });
  }
};

export const handlePayPalSuccess = async (req: Request, res: Response) => {
  try {
    const enrollmentId = req.query.id as string;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).send('Enrollment not found');
    }

    if (enrollment.offeringType === 'Marathon' && enrollment.subscriptionId) {
      const accessToken = await getPayPalAccessToken();
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://api.paypal.com'
        : 'https://api.sandbox.paypal.com';

      const subscriptionResponse = await axios({
        method: 'get',
        url: `${baseUrl}/v1/billing/subscriptions/${enrollment.subscriptionId}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (subscriptionResponse.data.status === 'ACTIVE') {
        const nextPaymentDue = new Date();
        nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

        await Enrollment.findByIdAndUpdate(
          enrollmentId,
          {
            $set: {
              paymentStatus: 'active',
              nextPaymentDue: nextPaymentDue
            },
            $push: {
              paymentHistory: {
                amount: enrollment.monthlyAmount || enrollment.totalAmount,
                date: new Date(),
                status: 'completed',
                processor: 'paypal',
                transactionId: enrollment.subscriptionId
              }
            }
          }
        );
      }
    } else if (enrollment.paymentTransactionId) {
      const accessToken = await getPayPalAccessToken();
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://api.paypal.com'
        : 'https://api.sandbox.paypal.com';

      const orderResponse = await axios({
        method: 'get',
        url: `${baseUrl}/v2/checkout/orders/${enrollment.paymentTransactionId}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (orderResponse.data.status !== 'COMPLETED') {
        await axios({
          method: 'post',
          url: `${baseUrl}/v2/checkout/orders/${enrollment.paymentTransactionId}/capture`,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }

      await Enrollment.findByIdAndUpdate(
        enrollmentId,
        {
          $set: {
            paymentStatus: 'completed',
            paymentDate: new Date()
          },
          $push: {
            paymentHistory: {
              amount: enrollment.totalAmount,
              date: new Date(),
              status: 'completed',
              processor: 'paypal',
              transactionId: enrollment.paymentTransactionId
            }
          }
        }
      );
    }

    return res.redirect(`/dashboard/enrollments?success=true`);
  } catch (error) {
    console.error('PayPal success processing error:', error);
    return res.redirect(`/dashboard/enrollments?error=payment-verification-failed`);
  }
};

export const handlePayPalCancel = async (req: Request, res: Response) => {
  try {
    const enrollmentId = req.query.id as string;

    await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        $set: {
          paymentStatus: 'cancelled'
        }
      }
    );

    return res.redirect(`/dashboard/enrollments?error=payment-cancelled`);
  } catch (error) {
    console.error('PayPal cancel processing error:', error);
    return res.redirect(`/dashboard/enrollments?error=system-error`);
  }
};