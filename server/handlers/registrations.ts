import { Request, Response } from "express";
import { Registration } from "../models/registration";
import mongoose from "mongoose";
import { sendMail } from "./../services/email";
import { generateInvoicePDF } from "../utils/pdf-generator";
import { getRegistrationEmailTemplate } from "../utils/email-templates";
import User, { UserRole } from "../models/user";
import { InMemoryStore } from '../in-memory/InMemoryStore';
import { attachedNewPaymentToClientAccount, createStripSubscription, createStripSubscriptionWithTrial, createStripePayment, stripe } from './helpers/stripe-client';

export const createRegistration = async (req: Request, res: Response) => {
  try {
    const registrationData = req.body;
    const requiredFields = [
      'parentFirstName', 'parentLastName', 'parentEmail', 'parentPhone',
      'studentFirstName', 'studentLastName', 'studentDOB',
      'programId', 'offeringId', 'enrollmentDate',
      'paymentMethod', 'firstPaymentAmount', 'adminFee', 'taxAmount', 'totalAmountDue',
      'stripeCustomerId', 'stripeCustomerId'
    ];

    for (const field of requiredFields) {
      if (!registrationData[field]) {
        return res.status(400).json({
          message: `Missing required field: ${field}`
        });
      }
    }
    const { stripePaymentMethodId, stripeCustomerId } = registrationData;

    const existingUser = await User.findOne({ email: registrationData.parentEmail });
    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists"
      });
    }
    if (!mongoose.Types.ObjectId.isValid(registrationData.programId) ||
      !mongoose.Types.ObjectId.isValid(registrationData.offeringId)) {
      return res.status(400).json({
        message: "Invalid programId or offeringId format"
      });
    }
    const mem = InMemoryStore.getInstance();
    const program = mem.getProgramById(registrationData.programId);
    const offering = mem.getOfferingById(registrationData.offeringId);

    if (!program || !offering) {
      return res.status(400).json({
        message: "Invalid programId or offeringId"
      });
    }

    const newRegistration = new Registration({ ...registrationData, paymentStatus: 'incomplete' });
    const savedRegistration = await newRegistration.save();

    const totalAmount = registrationData.autoPayEnabled
      ? program.price + registrationData.taxAmount
      : registrationData.firstPaymentAmount + registrationData.adminFee + registrationData.taxAmount;

    if (registrationData.paymentMethod === 'credit-card') {
      savedRegistration.paymentProcessor = 'stripe';
      await attachedNewPaymentToClientAccount(stripeCustomerId, stripePaymentMethodId)
      const paymentIntent = await createStripePayment(stripeCustomerId, stripePaymentMethodId, program!.stripeProductId as string, totalAmount);
      savedRegistration.paymentDate = new Date();
      savedRegistration.paymentTransactionId = paymentIntent.id;
      savedRegistration.stripePaymentIntentId = paymentIntent.id;
      savedRegistration.paymentStatus = 'completed';
      var now = new Date();
      let nextPaymentDate = (now.getMonth() == 11)
        ? new Date(now.getFullYear() + 1, 0, 1)
        : new Date(now.getFullYear(), now.getMonth() + 1, 1);
      savedRegistration.nextPaymentDate = nextPaymentDate;
      if (registrationData.autoPayEnabled) {
        savedRegistration.autoPayAmount = totalAmount;
        const trialEnd = Math.floor(nextPaymentDate.getTime() / 1000);
        const subscription = await createStripSubscriptionWithTrial(stripeCustomerId,
          stripePaymentMethodId,
          program!.stripeProductId as string,
          totalAmount,
          trialEnd);
        savedRegistration.stripeSubscriptionId = subscription.id;
      }
    } else {
      savedRegistration.paymentProcessor = 'paypal';
    }

    await savedRegistration.save();
    const pdfBuffer = await generateInvoicePDF(savedRegistration);
    const emailHtml = getRegistrationEmailTemplate({
      parentFirstName: savedRegistration.parentFirstName,
      parentLastName: savedRegistration.parentLastName,
      studentFirstName: savedRegistration.studentFirstName,
      studentLastName: savedRegistration.studentLastName,
      registrationId: savedRegistration._id.toString(),
      parentEmail: savedRegistration.parentEmail
    });

    await sendMail({
      to: savedRegistration.parentEmail,
      subject: 'STEM Masters - Registration Confirmation',
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${savedRegistration._id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    res.status(201).json(savedRegistration);
  } catch (error) {
    console.error("Error creating registration:", error);
    res.status(500).json({
      message: "Failed to create registration",
      error: (error as Error).message
    });
  }
};

export const getRegistrationById = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({
        message: "Invalid registration ID format"
      });
    }

    const registration = await Registration.findById(registrationId)
      .populate('programId', 'name price')
      .populate('offeringId', 'name description');

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    res.status(200).json(registration);
  } catch (error) {
    console.error("Error fetching registration:", error);
    res.status(500).json({
      message: "Failed to fetch registration",
      error: (error as Error).message
    });
  }
};

export const verifyRegistration = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({
        message: "Invalid registration ID format"
      });
    }

    const registration = await Registration.findById(registrationId)
      .populate('programId', 'name price')
      .populate('offeringId', 'name description');

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    if (registration.isRegistrationComplete || registration.isRegLinkedWithEnrollment || registration.isUserSetup) {
      return res.status(400).json({
        message: "Link expired or account already created for this registration ID",
        isValid: false
      });
    }

    res.status(200).json({
      message: "Registration is valid",
      isValid: true,
      registration: registration
    });
  } catch (error) {
    console.error("Error verifying registration:", error);
    res.status(500).json({
      message: "Failed to verify registration",
      error: (error as Error).message
    });
  }
};

export const deleteRegistration = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({
        message: "Invalid registration ID format"
      });
    }

    const deletedRegistration = await Registration.findByIdAndDelete(registrationId);

    if (!deletedRegistration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    res.status(200).json({
      message: "Registration deleted successfully",
      registrationId: deletedRegistration._id
    });
  } catch (error) {
    console.error("Error deleting registration:", error);
    res.status(500).json({
      message: "Failed to delete registration",
      error: (error as Error).message
    });
  }
};


export const getRegistrations = async (req: Request, res: Response) => {
  try {
    const { isComplete, email, programId } = req.query;

    let query: any = {};

    if (isComplete !== undefined) {
      query.isRegistrationComplete = isComplete === 'true';
    }

    if (email) {
      query.parentEmail = email;
    }

    if (programId && mongoose.Types.ObjectId.isValid(programId as string)) {
      query.programId = programId;
    }

    const registrations = await Registration.find(query)
      .populate('programId', 'name price')
      .populate('offeringId', 'name')
      .sort('-createdAt');

    res.status(200).json({
      count: registrations.length,
      registrations
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({
      message: "Failed to fetch registrations",
      error: (error as Error).message
    });
  }
};