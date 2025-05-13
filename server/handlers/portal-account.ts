import { Request, Response } from "express";
import mongoose from "mongoose";
import { Registration } from "../models/registration";
import User, { UserRole } from "../models/user";
import Enrollment from "../models/enrollment";
import { Program, Module } from "../models/program";
import { ProgramProgress, ModuleProgress } from "../models/student-progress";
import { sendMail } from "../services/email";
import { getPortalAccountEmailTemplate } from "../utils/portal-account-email-templates";


async function generateUsername(firstName: string, lastName: string): Promise<string> {

  const firstPart = firstName.slice(0, 3).toLowerCase();
  const lastPart = lastName.slice(0, 3).toLowerCase();
  let baseUsername = firstPart + lastPart;

  let counter = 0;
  let username = baseUsername;

  while (await User.exists({ username })) {
    counter++;
    username = `${baseUsername}${counter.toString().padStart(2, '0')}`;
  }

  return username;
}

export const createPortalAccount = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      registrationId,
      password,
      address1,
      address2,
      city,
      state,
      zipCode,
      country
    } = req.body;

    if (!registrationId || !password || !address1 || !city || !state || !zipCode || !country) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const registration = await Registration.findById(registrationId)
      .populate('programId')
      .populate('offeringId', 'name');

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }


    if (registration.isRegistrationComplete || registration.isRegLinkedWithEnrollment || registration.isUserSetup) {
      return res.status(400).json({
        message: "Link expired or account already created for this registration ID"
      });
    }

    const parentUser = new User({
      firstName: registration.parentFirstName,
      lastName: registration.parentLastName,
      email: registration.parentEmail,
      password: password,
      phone: registration.parentPhone,
      address: {
        street: address1,
        street2: address2,
        city: city,
        state: state,
        zip: zipCode,
        country: country
      },
      role: UserRole.PARENT,
      active: true
    });

    const savedParent = await parentUser.save({ session });


    const studentUsername = await generateUsername(registration.studentFirstName, registration.studentLastName);


    const studentEmail = `${studentUsername}@stemmasters.com`;

    const studentUser = new User({
      firstName: registration.studentFirstName,
      lastName: registration.studentLastName,
      email: studentEmail,
      username: studentUsername,
      password: password,
      dateOfBirth: registration.studentDOB,
      role: UserRole.STUDENT,
      parentId: savedParent._id,
      active: true,

      location: "Main Learning Center",
      level: "Beginner",
      progress: 0,
      achievements: [],
      progressData: [
        { month: "Current", score: 0, date: new Date() }
      ],
      subjectProgress: [
        { subject: "Math", score: 0, lastUpdated: new Date() },
        { subject: "Science", score: 0, lastUpdated: new Date() },
        { subject: "English", score: 0, lastUpdated: new Date() },
        { subject: "History", score: 0, lastUpdated: new Date() }
      ]
    });

    const savedStudent = await studentUser.save({ session });


    savedParent.students = [savedStudent._id];
    await savedParent.save({ session });


    const program = await Program.findById(registration.programId).populate('modules');
    if (!program) {
      throw new Error('Program not found');
    }

    const enrollmentData: any = {
      programId: registration.programId,
      studentId: savedStudent._id,
      parentId: savedParent._id,
      programFee: registration.firstPaymentAmount,
      adminFee: registration.adminFee,
      taxAmount: registration.taxAmount,
      totalAmount: registration.totalAmountDue,
      offeringType: registration.offeringId.name.includes('Marathon') ? 'Marathon' : 'Sprint',
      paymentMethod: registration.paymentMethod,
      paymentStatus: 'completed'
    };


    if (enrollmentData.offeringType === 'Marathon') {
      enrollmentData.monthlyAmount = program.price;
      enrollmentData.subscriptionId = registration.paypalSubscriptionId || registration.stripeSubscriptionId || 'PENDING';
      enrollmentData.nextPaymentDue = new Date();
      enrollmentData.paymentHistory = [];
    } else {
      enrollmentData.paymentDate = new Date();
      enrollmentData.paymentTransactionId = registration.paypalOrderId || registration.stripePaymentIntentId || 'PENDING';
    }

    const enrollment = new Enrollment(enrollmentData);
    await enrollment.save({ session });


    const programProgress = new ProgramProgress({
      studentId: savedStudent._id,
      programId: registration.programId,
      completedModules: 0,
      totalModules: program.modules.length,
      completionPercentage: 0,
      lastUpdatedAt: new Date()
    });

    await programProgress.save({ session });


    const modules = await Module.find({ _id: { $in: program.modules } }).populate('topics');

    const moduleProgressPromises = modules.map(module => {
      return new ModuleProgress({
        studentId: savedStudent._id,
        moduleId: module._id,
        programId: registration.programId,
        completedTopics: 0,
        totalTopics: module.topics.length,
        completionPercentage: 0,
        lastUpdatedAt: new Date(),
        marks: 0
      }).save({ session });
    });

    await Promise.all(moduleProgressPromises);


    registration.isRegistrationComplete = true;
    registration.isRegLinkedWithEnrollment = true;
    registration.isUserSetup = true;
    await registration.save({ session });


    const emailHtml = getPortalAccountEmailTemplate({
      parentFirstName: registration.parentFirstName,
      parentLastName: registration.parentLastName,
      studentFirstName: registration.studentFirstName,
      studentLastName: registration.studentLastName,
      studentUsername: studentUsername,
      studentEmail: studentEmail,
      registrationId: registration._id.toString()
    });

    await sendMail({
      to: registration.parentEmail,
      subject: 'STEM Masters - Portal Account Created Successfully',
      html: emailHtml
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Account created successfully",
      parentId: savedParent._id,
      studentId: savedStudent._id,
      enrollmentId: enrollment._id,
      studentUsername: studentUsername
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating portal account:", error);
    return res.status(500).json({
      message: "Failed to create account",
      error: (error as Error).message
    });
  }
};