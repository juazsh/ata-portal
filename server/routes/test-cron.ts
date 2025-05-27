import type { Request, Response, Express } from "express";
import {
  handleOverduePaymentCheck,
  handlePaymentReminder
} from '../cron/handlers/payment-handlers';
import { getCronConfiguration, validateCronExpression } from '../cron/config';
import Enrollment from '../models/enrollment';
import User, { UserRole } from '../models/user';
import { Program } from '../models/program';

export function registerCronTestRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.post(
    "/api/test-overdue-check'",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    testHanldeOverduePaymentCheck
  );
  app.post("/api/test-payment-reminder",
    isAuthenticated,
    hasRole([UserRole.ADMIN,
    UserRole.OWNER]),
    testHandlePaymentReminder);
  app.post("/api/enable-test-jobs", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), (req, res) => {
    res.json({
      success: false,
      message: 'Test jobs are now controlled via environment variables.',
      instructions: {
        howTo: 'Set CRON_TEST_JOBS_ENABLED=true in your .env file and restart the application',
        testSchedules: {
          overdue: process.env.CRON_TEST_OVERDUE || '*/30 * * * * *',
          reminder: process.env.CRON_TEST_REMINDER || '*/45 * * * * *'
        },
        currentStatus: process.env.CRON_TEST_JOBS_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'
      }
    });
  });
  app.post("/api/disable-test-jobs", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), (req, res) => {
    res.json({
      success: false,
      message: 'Test jobs are now controlled via environment variables.',
      instructions: {
        howTo: 'Set CRON_TEST_JOBS_ENABLED=false in your .env file and restart the application',
        currentStatus: process.env.CRON_TEST_JOBS_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'
      }
    });
  });
  app.post(
    "/api/create-test-data",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    createTestDataForCronTest
  );
  app.post(
    "/api/cleanup-test-data",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    clearupTestDataForCronTest
  );
  app.get(
    "/api/cron-status",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    getCronDetails
  );
  app.post(
    "/api/validate-cron",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    validateCron
  );
}

const testHanldeOverduePaymentCheck = async (req: Request, res: Response) => {
  try {
    const { isFinalNotice = false } = req.body;
    console.log(`Testing overdue payment check - Final Notice: ${isFinalNotice}`);
    await handleOverduePaymentCheck(isFinalNotice);
    res.json({
      success: true,
      message: `Overdue payment check test completed (Final Notice: ${isFinalNotice})`
    });
  } catch (error) {
    console.error('Test overdue check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: (error as Error).message
    });
  }
}

const testHandlePaymentReminder = async (req: Request, res: Response) => {

  try {
    const { isSecondReminder = false } = req.body;

    console.log(`Testing payment reminder - Second Reminder: ${isSecondReminder}`);
    await handlePaymentReminder(isSecondReminder);

    res.json({
      success: true,
      message: `Payment reminder test completed (Second Reminder: ${isSecondReminder})`
    });
  } catch (error) {
    console.error('Test payment reminder failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: (error as Error).message
    });
  }
}

const createTestDataForCronTest = async (req: Request, res: Response) => {
  try {
    const testParent = new User({
      firstName: 'Test',
      lastName: 'Parent',
      email: 'test.parent@example.com',
      password: 'temppassword123',
      role: UserRole.PARENT,
      phone: '555-0123'
    });
    await testParent.save();
    const testStudent = new User({
      firstName: 'Test',
      lastName: 'Student',
      email: 'test.student@example.com',
      password: 'temppassword123',
      role: UserRole.STUDENT,
      parentId: testParent._id,
      username: 'teststudent123'
    });
    await testStudent.save();
    testParent.students = [testStudent._id];
    await testParent.save();
    let testProgram = await Program.findOne({ name: 'Test STEM Program' });
    if (!testProgram) {
      testProgram = new Program({
        name: 'Test STEM Program',
        description: 'A test program for cron job testing',
        price: 99.99,
        modules: [],
        ageGroup: '8-12',
        duration: '3 months',
        level: 'Beginner'
      });
      await testProgram.save();
    }
    const testEnrollment = new Enrollment({
      programId: testProgram._id,
      studentId: testStudent._id,
      parentId: testParent._id,
      programFee: 99.99,
      adminFee: 4.99,
      taxAmount: 7.35,
      totalAmount: 112.33,
      offeringType: 'Marathon',
      paymentMethod: 'credit-card',
      paymentStatus: 'active',
      classSessions: ['Monday 4PM', 'Wednesday 4PM'],
      monthlyAmount: 99.99,
      subscriptionId: 'test_sub_123',
      nextPaymentDue: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      monthlyPaymentReceived: false,
      paymentHistory: [
        {
          amount: 99.99,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          status: 'completed',
          processor: 'stripe',
          transactionId: 'test_txn_001'
        }
      ]
    });
    await testEnrollment.save();
    res.json({
      success: true,
      message: 'Test data created successfully',
      data: {
        parentId: testParent._id,
        studentId: testStudent._id,
        programId: testProgram._id,
        enrollmentId: testEnrollment._id,
        parentEmail: testParent.email
      }
    });
  } catch (error) {
    console.error('Error creating test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test data',
      error: (error as Error).message
    });
  }
}

const clearupTestDataForCronTest = async (req: Request, res: Response) => {
  try {
    const deletedEnrollments = await Enrollment.deleteMany({
      subscriptionId: { $regex: /^test_/ }
    });
    const deletedUsers = await User.deleteMany({
      email: { $regex: /test\.(parent|student)@example\.com/ }
    });
    const deletedPrograms = await Program.deleteMany({
      name: 'Test STEM Program'
    });

    res.json({
      success: true,
      message: 'Test data cleaned up successfully',
      deleted: {
        enrollments: deletedEnrollments.deletedCount,
        users: deletedUsers.deletedCount,
        programs: deletedPrograms.deletedCount
      }
    });
  } catch (error) {
    console.error('Error cleaning test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean test data',
      error: (error as Error).message
    });
  }
}

const getCronDetails = async (req: Request, res: Response) => {
  const config = getCronConfiguration();

  res.json({
    success: true,
    message: 'Cron configuration status',
    configuration: config,
    help: {
      cronFormat: 'minute hour day month dayOfWeek',
      examples: {
        '0 9 2 * *': '9 AM on 2nd of every month',
        '30 14 15 * *': '2:30 PM on 15th of every month',
        '0 8 1,15 * *': '8 AM on 1st and 15th of every month',
        '0 */6 * * *': 'Every 6 hours',
        '*/30 * * * * *': 'Every 30 seconds (testing only)'
      },
      envVariables: {
        schedules: [
          'CRON_OVERDUE_CHECK_FIRST',
          'CRON_OVERDUE_CHECK_FINAL',
          'CRON_PAYMENT_REMINDER_FIRST',
          'CRON_PAYMENT_REMINDER_FINAL'
        ],
        enablers: [
          'CRON_OVERDUE_CHECK_FIRST_ENABLED=true/false',
          'CRON_OVERDUE_CHECK_FINAL_ENABLED=true/false',
          'CRON_PAYMENT_REMINDER_FIRST_ENABLED=true/false',
          'CRON_PAYMENT_REMINDER_FINAL_ENABLED=true/false',
          'CRON_TEST_JOBS_ENABLED=true/false'
        ]
      }
    }
  });
}

const validateCron = (req: Request, res: Response) => {

  const { expression } = req.body;
  if (!expression) {
    return res.status(400).json({
      success: false,
      message: 'Cron expression is required'
    });
  }
  const isValid = validateCronExpression(expression);
  res.json({
    success: true,
    expression,
    isValid,
    message: isValid ? 'Valid cron expression' : 'Invalid cron expression'
  });
}