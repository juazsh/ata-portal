import { Request, Response } from "express";
import mongoose from "mongoose";
import { Registration } from "../models/registration";
import User, { UserRole } from "../models/user";
import Enrollment from "../models/enrollment";
import { Program, Module } from "../models/program";
import { ProgramProgress, ModuleProgress } from "../models/student-progress";
import { sendMail } from "../services/email";
import { getPortalAccountEmailTemplate } from "../utils/portal-account-email-templates";
import { updateSessionCapacity } from "./class-sessions";
import { ClassSession } from '../models/class-session';
import { addStripePaymentForUser } from "./payment";

async function createParentUser(
  registration: any,
  password: string,
  address: any,
  session: mongoose.ClientSession
): Promise<mongoose.Document> {
  const parentUser = new User({
    firstName: registration.parentFirstName,
    lastName: registration.parentLastName,
    email: registration.parentEmail,
    password: password,
    phone: registration.parentPhone,
    address: {
      street: address.street,
      street2: address.street2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country
    },
    role: UserRole.PARENT,
    active: true,
  });
  registration.paymentProcessor == 'stripe' 
  ? parentUser.stripeCustomerId = registration.stripeCustomerId
  : parentUser.paypalPayerId = registration.paypalPayerId;
  return await parentUser.save({ session });
}

async function createStudentUser(
  firstName: string,
  lastName: string,
  dob: Date,
  parentId: mongoose.Types.ObjectId,
  password: string,
  session: mongoose.ClientSession
): Promise<{ user: mongoose.Document, username: string, email: string }> {
  const username = await generateUsername(firstName, lastName);
  const email = `${username}@stemmasters.com`;
  const studentUser = new User({
    firstName: firstName,
    lastName: lastName,
    email: email,
    username: username,
    password: password,
    dateOfBirth: dob,
    role: UserRole.STUDENT,
    parentId: parentId,
    active: true,
    location: "Main Learning Center",
    level: "Beginner",
    progress: 0,
    achievements: [],
    progressData: [{ month: "Current", score: 0, date: new Date() }],
    subjectProgress: [
      { subject: "Math", score: 0, lastUpdated: new Date() },
      { subject: "Science", score: 0, lastUpdated: new Date() },
      { subject: "English", score: 0, lastUpdated: new Date() },
      { subject: "History", score: 0, lastUpdated: new Date() }
    ]
  });

  const savedStudent = await studentUser.save({ session });
  return { user: savedStudent, username, email };
}

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
      country,
      classSessions
    } = req.body;

    if (!registrationId || !password || !address1 || !city || !state || !zipCode || !country || !classSessions || !classSessions.length) {
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

    const isProgramTwiceAWeek = registration.offeringId.name.toLowerCase().includes('twice');
    const expectedSessionCount = isProgramTwiceAWeek ? 2 : 1;

    if (classSessions.length !== expectedSessionCount) {
      return res.status(400).json({
        message: `This program requires exactly ${expectedSessionCount} class session(s)`
      });
    }

    console.log("Class Session check passed");

    const sessionDays = new Set();
    for (const sessionId of classSessions) {
      const sessionDay = await getSessionDay(sessionId);
      if (sessionDay && sessionDays.has(sessionDay)) {
        return res.status(400).json({
          message: "You cannot select multiple sessions on the same day"
        });
      }
      if (sessionDay) {
        sessionDays.add(sessionDay);
      }
    }

    const capacityResults = [];
    for (const sessionId of classSessions) {
      const result = await updateSessionCapacity(sessionId, false);
      capacityResults.push(result);
    }

    if (capacityResults.includes(false)) {
      return res.status(400).json({
        message: "One or more selected sessions are no longer available. Please select different sessions."
      });
    }

    console.log("Session capacity updated successfully");

    const savedParent = await createParentUser(
      registration,
      password,
      {
        street: address1,
        street2: address2,
        city,
        state,
        zip: zipCode,
        country
      },
      session
    );


    await addStripePaymentForUser(savedParent._id as string,
      registration.stripeCustomerId, 
      registration.stripePaymentMethodId,
      true,
      session);

    console.log("Parent user created successfully", savedParent);
    
    const parentUser = savedParent as import('../models/user').IUser;
    const parentObjectId = parentUser._id as mongoose.Types.ObjectId;

    const { user: savedStudent, username, email } = await createStudentUser(
      registration.studentFirstName,
      registration.studentLastName,
      registration.studentDOB,
      parentObjectId,
      password,
      session
    );

    if (Array.isArray(parentUser.students)) {
      parentUser.students.push(savedStudent._id as mongoose.Types.ObjectId);
    } else {
      parentUser.students = [savedStudent._id as mongoose.Types.ObjectId];
    }
    await parentUser.save({ session });

    console.log("Student user created successfully", savedStudent);

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
      paymentStatus: 'completed',
      classSessions: classSessions
    };

    if (enrollmentData.offeringType === 'Marathon') {
      enrollmentData.monthlyAmount = program.price;
      enrollmentData.subscriptionId = registration.paypalSubscriptionId || registration.stripeSubscriptionId || 'PENDING';
      enrollmentData.nextPaymentDue = registration.nextPaymentDate;
      enrollmentData.paymentTransactionId = registration.paymentTransactionId
    } else {
      enrollmentData.paymentDate = registration.paymentDate;
      enrollmentData.paymentTransactionId = registration.paypalOrderId || registration.stripePaymentIntentId || 'PENDING';
    }
    const firstPayment = {amount: registration.totalAmountDue, 
      date: registration.paymentDate, 
      status: 'completed', 
      processor: registration.paymentProcessor,
      transactionId: registration.paymentTransactionId,
     }
    enrollmentData.paymentHistory = [firstPayment];
    const enrollment = new Enrollment(enrollmentData);
    await enrollment.save({ session });
    console.log("Enrollment created successfully", enrollment);
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

    const moduleProgressPromises = modules.map((module: any) => {
      const totalTopics = Array.isArray(module.topics) ? module.topics.length : 0;
      return new ModuleProgress({
        studentId: savedStudent._id,
        moduleId: module._id,
        programId: registration.programId,
        completedTopics: 0,
        totalTopics,
        completionPercentage: 0,
        lastUpdatedAt: new Date(),
        marks: 0
      }).save({ session });
    });

    await Promise.all(moduleProgressPromises);

    console.log("success creating related components");

    registration.isRegistrationComplete = true;
    registration.isRegLinkedWithEnrollment = true;
    registration.isUserSetup = true;
    await registration.save({ session });

    console.log("Registration updated successfully");

    const emailHtml = getPortalAccountEmailTemplate({
      parentFirstName: registration.parentFirstName,
      parentLastName: registration.parentLastName,
      studentFirstName: registration.studentFirstName,
      studentLastName: registration.studentLastName,
      studentUsername: username,
      studentEmail: email,
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
      studentUsername: username
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

export const createAdditionalStudent = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { parentId, programId, classSessions, studentFirstName, studentLastName, studentDOB } = req.body;

    if (!parentId || !programId || !studentFirstName || !studentLastName || !studentDOB) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parent = await User.findById(parentId).session(session);
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    const program = await Program.findById(programId).populate('modules').session(session);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    
    const { user: savedStudent, username, email } = await createStudentUser(
      studentFirstName,
      studentLastName,
      studentDOB,
      parentId,
      '',
      session
    );

    
    const enrollment = new Enrollment({
      programId,
      studentId: savedStudent._id,
      parentId,
      paymentMethod: 'manual',
      paymentStatus: 'pending',
      programFee: program.price,
      totalAmount: program.price,
      classSessions
    });

    await enrollment.save({ session });

    const programProgress = new ProgramProgress({
      studentId: savedStudent._id,
      programId,
      completedModules: 0,
      totalModules: program.modules.length,
      completionPercentage: 0,
      lastUpdatedAt: new Date()
    });
    await programProgress.save({ session });

    const moduleProgressPromises = program.modules.map((module: any) =>
      new ModuleProgress({
        studentId: savedStudent._id,
        moduleId: module._id,
        programId,
        completedTopics: 0,
        totalTopics: module.topics.length,
        completionPercentage: 0,
        lastUpdatedAt: new Date(),
        marks: 0
      }).save({ session })
    );
    await Promise.all(moduleProgressPromises);

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Additional student account created successfully",
      studentId: savedStudent._id,
      username,
      enrollmentId: enrollment._id
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating additional student:", error);
    return res.status(500).json({
      message: "Failed to create additional student",
      error: (error as Error).message
    });
  }
};

async function getSessionDay(sessionId: string): Promise<string | null> {
  try {
    const session = await ClassSession.findOne({ id: sessionId });
    return session ? session.weekday : null;
  } catch (error) {
    console.error("Error fetching session day:", error);
    return null;
  }
}