import { Request, Response } from 'express';
import User, { UserRole } from '../models/user';
import Enrollment from '../models/enrollment';
import { Program } from '../models/program';
import { ProgramProgress, ModuleProgress } from '../models/student-progress';
import { Module } from '../models/program';
import mongoose from 'mongoose';
import { processStripePayment } from './helpers/process-stripe-payments';
import { processPayPalPayment } from './helpers/process-paypal-payment';

export const createEnrollment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      programId,
      studentId,
      parentId,
      paymentMethod,
      offeringType
    } = req.body;

    const currentUser = req.user as any;

    if (!programId || !studentId || !paymentMethod || !offeringType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!['Marathon', 'Sprint'].includes(offeringType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid offering type. Must be Marathon or Sprint'
      });
    }

    if (offeringType === 'Marathon' && (!req.body.monthlyAmount || !req.body.subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'Marathon enrollment requires monthlyAmount and subscriptionId'
      });
    }

    if (offeringType === 'Sprint' && (!req.body.paymentDate || !req.body.paymentTransactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Sprint enrollment requires paymentDate and paymentTransactionId'
      });
    }

    const program = await Program.findById(programId).populate('modules');
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    let finalParentId = parentId;

    if (currentUser.role === UserRole.PARENT) {
      const student = await User.findOne({
        _id: studentId,
        parentId: currentUser.id
      });

      if (!student) {
        return res.status(403).json({
          success: false,
          message: 'You can only enroll your own students'
        });
      }

      finalParentId = currentUser.id;
    } else if ([UserRole.ADMIN, UserRole.OWNER].includes(currentUser.role)) {
      const student = await User.findOne({
        _id: studentId,
        role: UserRole.STUDENT
      });

      const parent = await User.findOne({
        _id: finalParentId,
        role: UserRole.PARENT
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent not found'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const programFee = program.price;
    const adminFee = programFee * 0.05;
    const taxRate = 0.07;
    const taxAmount = (programFee + adminFee) * taxRate;
    const totalAmount = programFee + adminFee + taxAmount;

    const enrollmentData: any = {
      programId,
      studentId,
      parentId: finalParentId,
      programFee,
      adminFee,
      taxAmount,
      totalAmount,
      offeringType,
      paymentMethod,
      paymentStatus: 'pending'
    };

    if (offeringType === 'Marathon') {
      enrollmentData.monthlyAmount = req.body.monthlyAmount;
      enrollmentData.subscriptionId = req.body.subscriptionId;
      enrollmentData.nextPaymentDue = req.body.nextPaymentDue || new Date();
      enrollmentData.paymentHistory = req.body.paymentHistory || [];
    } else {
      enrollmentData.paymentDate = req.body.paymentDate;
      enrollmentData.paymentTransactionId = req.body.paymentTransactionId;
    }

    const enrollment = new Enrollment(enrollmentData);
    await enrollment.save({ session });

    const programProgress = new ProgramProgress({
      studentId,
      programId,
      completedModules: 0,
      totalModules: program.modules.length,
      completionPercentage: 0,
      lastUpdatedAt: new Date()
    });

    await programProgress.save({ session });

    const modules = await Module.find({ _id: { $in: program.modules } }).populate('topics');

    const moduleProgressPromises = modules.map(module => {
      return new ModuleProgress({
        studentId,
        moduleId: module._id,
        programId,
        completedTopics: 0,
        totalTopics: module.topics.length,
        completionPercentage: 0,
        lastUpdatedAt: new Date(),
        marks: 0
      }).save({ session });
    });

    await Promise.all(moduleProgressPromises);

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      enrollment
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error creating enrollment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create enrollment',
      error: (error as Error).message
    });
  }
};

export const getEnrollmentById = async (req: Request, res: Response) => {
  try {
    
    const { enrollmentId } = req.params;
    const currentUser = req.user as any;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('programId', 'name description price')
      .populate('studentId', 'firstName lastName email')
      .populate('parentId', 'firstName lastName email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    if (
      currentUser.role === UserRole.PARENT &&
      enrollment.parentId._id.toString() !== currentUser.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this enrollment'
      });
    }

    return res.status(200).json({
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollment',
      error: (error as Error).message
    });
  }
};

export const getEnrollments = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as any;
    let query = {};

    if (currentUser.role === UserRole.PARENT) {
      query = { parentId: currentUser.id };
    }

    const enrollments = await Enrollment.find(query)
      .populate('programId', 'name description price')
      .populate('studentId', 'firstName lastName email')
      .populate('parentId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments',
      error: (error as Error).message
    });
  }
};

export const updateEnrollment = async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params;
    const updateData = req.body;
    const currentUser = req.user as any;

    if (![UserRole.ADMIN, UserRole.OWNER].includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update enrollments'
      });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (updateData.paymentHistory && enrollment.offeringType === 'Marathon') {
      updateData.paymentHistory = [...(enrollment.paymentHistory || []), ...updateData.paymentHistory];
    }

    if (updateData.offeringType && updateData.offeringType !== enrollment.offeringType) {
      if (updateData.offeringType === 'Sprint' && (!updateData.paymentDate || !updateData.paymentTransactionId)) {
        return res.status(400).json({
          success: false,
          message: 'Sprint enrollment requires paymentDate and paymentTransactionId'
        });
      }

      if (updateData.offeringType === 'Marathon' && (!updateData.monthlyAmount || !updateData.subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: 'Marathon enrollment requires monthlyAmount and subscriptionId'
        });
      }
    }

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('programId studentId parentId');

    return res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      enrollment: updatedEnrollment
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update enrollment',
      error: (error as Error).message
    });
  }
};

export const deleteEnrollment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { enrollmentId } = req.params;
    const currentUser = req.user as any;

    if (![UserRole.ADMIN, UserRole.OWNER].includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete enrollments'
      });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    await ProgramProgress.findOneAndDelete({
      studentId: enrollment.studentId,
      programId: enrollment.programId
    }, { session });

    await ModuleProgress.deleteMany({
      studentId: enrollment.studentId,
      programId: enrollment.programId
    }, { session });

    await enrollment.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Enrollment and associated progress records deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error deleting enrollment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete enrollment',
      error: (error as Error).message
    });
  }
};

export const getEnrollmentsByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const currentUser = req.user as any;

    if (
      currentUser.role === UserRole.PARENT &&
      !(await User.exists({ _id: studentId, parentId: currentUser.id }))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this student'
      });
    }

    const enrollments = await Enrollment.find({ studentId })
      .populate('programId', 'name description price')
      .populate('studentId', 'firstName lastName email')
      .populate('parentId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments
    });
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student enrollments',
      error: (error as Error).message
    });
  }
};

export const processEnrollmentPayment = async (req: Request, res: Response) => {
  try {
    const {
      enrollmentId,
      paymentMethodId,
      paymentProcessor = 'stripe'
    } = req.body;

    const currentUser = req.user as any;

    if (![UserRole.ADMIN, UserRole.OWNER, UserRole.PARENT].includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to process payments'
      });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (
      currentUser.role === UserRole.PARENT &&
      enrollment.parentId.toString() !== currentUser.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to process payment for this enrollment'
      });
    }

    const user = await User.findById(enrollment.parentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Parent user not found'
      });
    }

    if (paymentProcessor === 'stripe') {
      return await processStripePayment(user, enrollment, paymentMethodId, res);
    } else if (paymentProcessor === 'paypal') {
      return await processPayPalPayment(user, enrollment, paymentMethodId, res);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment processor selected'
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: (error as Error).message
    });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params;
    const currentUser = req.user as any;

    if (![UserRole.ADMIN, UserRole.OWNER].includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel subscriptions'
      });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (enrollment.offeringType !== 'Marathon') {
      return res.status(400).json({
        success: false,
        message: 'Only Marathon enrollments can be cancelled'
      });
    }

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { $set: { paymentStatus: 'cancelled' } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      enrollment: updatedEnrollment
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: (error as Error).message
    });
  }
};