import Enrollment from '../../models/enrollment';
import User, { UserRole } from '../../models/user';
import { Program } from '../../models/program';
import { sendMail } from '../../services/email';
import {
  getOverduePaymentEmailTemplate,
  getPaymentReminderEmailTemplate,
  getOwnerSummaryEmailTemplate
} from '../templates';

export async function handleOverduePaymentCheck(isFinalNotice: boolean = false) {
  try {
    console.log(`Starting overdue payment check - Final Notice: ${isFinalNotice}`);
    const overdueEnrollments = await Enrollment.find({
      offeringType: 'Marathon',
      paymentStatus: { $in: ['active', 'pending'] },
      monthlyPaymentReceived: false,
      nextPaymentDue: { $lte: new Date() }
    }).populate('studentId parentId programId');

    console.log(`Found ${overdueEnrollments.length} overdue enrollments`);

    if (overdueEnrollments.length === 0) {
      return;
    }
    const emailPromises = overdueEnrollments.map(async (enrollment) => {
      const parent = enrollment.parentId as any;
      const student = enrollment.studentId as any;
      const program = enrollment.programId as any;

      const emailTemplate = getOverduePaymentEmailTemplate({
        parentFirstName: parent.firstName,
        parentLastName: parent.lastName,
        studentFirstName: student.firstName,
        studentLastName: student.lastName,
        programName: program.name,
        monthlyAmount: enrollment.monthlyAmount!,
        nextPaymentDue: enrollment.nextPaymentDue!,
        isFinalNotice,
        enrollmentId: enrollment._id.toString()
      });

      return sendMail({
        to: parent.email,
        subject: isFinalNotice
          ? 'FINAL NOTICE: Overdue Payment - Enrollment Suspended'
          : 'Payment Overdue - Action Required',
        html: emailTemplate
      });
    });

    await Promise.all(emailPromises);

    if (isFinalNotice) {
      await Enrollment.updateMany(
        { _id: { $in: overdueEnrollments.map(e => e._id) } },
        { $set: { paymentStatus: 'suspended' } }
      );
      console.log(`Marked ${overdueEnrollments.length} enrollments as suspended`);
    }

    await sendOwnerSummaryEmail(overdueEnrollments, isFinalNotice);

    console.log(`Overdue payment check completed. Processed ${overdueEnrollments.length} enrollments`);
  } catch (error) {
    console.error('Error in handleOverduePaymentCheck:', error);
    throw error;
  }
}

export async function handlePaymentReminder(isSecondReminder: boolean = false) {
  try {
    console.log(`Starting payment reminder - Second Reminder: ${isSecondReminder}`);

    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const monthAfter = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1);
    const activeEnrollments = await Enrollment.find({
      offeringType: 'Marathon',
      paymentStatus: 'active'
    }).populate('studentId parentId programId');
    console.log(`Found ${activeEnrollments.length} active enrollments to check`);

    const enrollmentsNeedingReminder = [];
    for (const enrollment of activeEnrollments) {
      const hasNextMonthPayment = enrollment.paymentHistory?.some(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= nextMonth && paymentDate < monthAfter && payment.status === 'completed';
      });

      if (!hasNextMonthPayment) {
        enrollmentsNeedingReminder.push(enrollment);
      }
    }
    console.log(`Found ${enrollmentsNeedingReminder.length} enrollments needing payment reminder`);

    if (enrollmentsNeedingReminder.length === 0) {
      return;
    }
    const emailPromises = enrollmentsNeedingReminder.map(async (enrollment) => {
      const parent = enrollment.parentId as any;
      const student = enrollment.studentId as any;
      const program = enrollment.programId as any;

      const hasAutoPay = enrollment.subscriptionId && enrollment.paymentMethod;

      const emailTemplate = getPaymentReminderEmailTemplate({
        parentFirstName: parent.firstName,
        parentLastName: parent.lastName,
        studentFirstName: student.firstName,
        studentLastName: student.lastName,
        programName: program.name,
        monthlyAmount: enrollment.monthlyAmount!,
        nextPaymentDue: nextMonth,
        hasAutoPay,
        isSecondReminder,
        enrollmentId: enrollment._id.toString()
      });

      return sendMail({
        to: parent.email,
        subject: isSecondReminder
          ? 'Final Reminder: Upcoming Payment Due'
          : 'Payment Reminder: Next Month\'s Tuition',
        html: emailTemplate
      });
    });
    await Promise.all(emailPromises);
    console.log(`Payment reminder completed. Sent ${enrollmentsNeedingReminder.length} reminders`);
  } catch (error) {
    console.error('Error in handlePaymentReminder:', error);
    throw error;
  }
}

async function sendOwnerSummaryEmail(overdueEnrollments: any[], isFinalNotice: boolean) {
  try {
    const owners = await User.find({ role: UserRole.OWNER });
    if (owners.length === 0) {
      console.log('No owner users found for summary email');
      return;
    }
    const summaryData = overdueEnrollments.map(enrollment => ({
      parentName: `${enrollment.parentId.firstName} ${enrollment.parentId.lastName}`,
      parentEmail: enrollment.parentId.email,
      studentName: `${enrollment.studentId.firstName} ${enrollment.studentId.lastName}`,
      programName: enrollment.programId.name,
      monthlyAmount: enrollment.monthlyAmount,
      nextPaymentDue: enrollment.nextPaymentDue,
      enrollmentId: enrollment._id.toString()
    }));

    const emailTemplate = getOwnerSummaryEmailTemplate({
      overdueEnrollments: summaryData,
      isFinalNotice,
      totalAmount: summaryData.reduce((sum, item) => sum + item.monthlyAmount, 0)
    });

    const ownerEmailPromises = owners.map(owner =>
      sendMail({
        to: owner.email,
        subject: isFinalNotice
          ? 'FINAL NOTICE Summary: Suspended Enrollments'
          : 'Overdue Payment Summary',
        html: emailTemplate
      })
    );

    await Promise.all(ownerEmailPromises);
    console.log(`Summary email sent to ${owners.length} owners`);
  } catch (error) {
    console.error('Error sending owner summary email:', error);
  }
}

export async function testOverduePaymentCheck() {
  console.log('Running TEST overdue payment check...');
  await handleOverduePaymentCheck(false);
}

export async function testPaymentReminder() {
  console.log('Running TEST payment reminder...');
  await handlePaymentReminder(false);
}