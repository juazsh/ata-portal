import cron from 'node-cron';
import {
  handleOverduePaymentCheck,
  handlePaymentReminder,
  testOverduePaymentCheck,
  testPaymentReminder
} from './handlers/payment-handlers';

export interface CronJobConfig {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  enabled: boolean;
}

const DEFAULT_SCHEDULES = {
  OVERDUE_CHECK_FIRST: '0 9 2 * *',      // 9 AM on 2nd of every month
  OVERDUE_CHECK_FINAL: '0 9 5 * *',      // 9 AM on 5th of every month
  PAYMENT_REMINDER_FIRST: '0 9 15 * *',  // 9 AM on 15th of every month
  PAYMENT_REMINDER_FINAL: '0 9 27 * *'   // 9 AM on 27th of every month
};

export const cronJobs: CronJobConfig[] = [
  {
    name: 'Overdue Payment Check - First Notice',
    schedule: process.env.CRON_OVERDUE_CHECK_FIRST || DEFAULT_SCHEDULES.OVERDUE_CHECK_FIRST,
    handler: () => handleOverduePaymentCheck(false),
    enabled: process.env.CRON_OVERDUE_CHECK_FIRST_ENABLED !== 'false'
  },
  {
    name: 'Overdue Payment Check - Final Notice',
    schedule: process.env.CRON_OVERDUE_CHECK_FINAL || DEFAULT_SCHEDULES.OVERDUE_CHECK_FINAL,
    handler: () => handleOverduePaymentCheck(true),
    enabled: process.env.CRON_OVERDUE_CHECK_FINAL_ENABLED !== 'false'
  },
  {
    name: 'Payment Reminder - First Reminder',
    schedule: process.env.CRON_PAYMENT_REMINDER_FIRST || DEFAULT_SCHEDULES.PAYMENT_REMINDER_FIRST,
    handler: () => handlePaymentReminder(false),
    enabled: process.env.CRON_PAYMENT_REMINDER_FIRST_ENABLED !== 'false'
  },
  {
    name: 'Payment Reminder - Final Reminder',
    schedule: process.env.CRON_PAYMENT_REMINDER_FINAL || DEFAULT_SCHEDULES.PAYMENT_REMINDER_FINAL,
    handler: () => handlePaymentReminder(true),
    enabled: process.env.CRON_PAYMENT_REMINDER_FINAL_ENABLED !== 'false'
  }
];

export const testJobs: CronJobConfig[] = [
  {
    name: 'Test Overdue Payment Check',
    schedule: process.env.CRON_TEST_OVERDUE || '*/30 * * * * *',
    handler: testOverduePaymentCheck,
    enabled: process.env.CRON_TEST_JOBS_ENABLED === 'true'
  },
  {
    name: 'Test Payment Reminder',
    schedule: process.env.CRON_TEST_REMINDER || '*/45 * * * * *',
    handler: testPaymentReminder,
    enabled: process.env.CRON_TEST_JOBS_ENABLED === 'true'
  }
];

export function startCronJobs() {
  console.log('Starting cron jobs...');
  console.log('Environment cron settings:');
  console.log(`  CRON_OVERDUE_CHECK_FIRST: ${process.env.CRON_OVERDUE_CHECK_FIRST || 'default'}`);
  console.log(`  CRON_OVERDUE_CHECK_FINAL: ${process.env.CRON_OVERDUE_CHECK_FINAL || 'default'}`);
  console.log(`  CRON_PAYMENT_REMINDER_FIRST: ${process.env.CRON_PAYMENT_REMINDER_FIRST || 'default'}`);
  console.log(`  CRON_PAYMENT_REMINDER_FINAL: ${process.env.CRON_PAYMENT_REMINDER_FINAL || 'default'}`);
  console.log(`  CRON_TEST_JOBS_ENABLED: ${process.env.CRON_TEST_JOBS_ENABLED || 'false'}`);

  const allJobs = [...cronJobs, ...testJobs];

  allJobs.forEach(job => {
    if (job.enabled) {
      console.log(`✅ Scheduling job: ${job.name} with schedule: ${job.schedule}`);
      cron.schedule(job.schedule, async () => {
        console.log(`🚀 Executing job: ${job.name} at ${new Date().toISOString()}`);
        try {
          await job.handler();
          console.log(`✅ Job completed successfully: ${job.name}`);
        } catch (error) {
          console.error(`❌ Job failed: ${job.name}`, error);
        }
      });
    } else {
      console.log(`❌ Job disabled: ${job.name}`);
    }
  });

  console.log(`🎯 Total active cron jobs: ${allJobs.filter(job => job.enabled).length}`);
}

export function validateCronExpression(expression: string): boolean {
  try {
    cron.validate(expression);
    return true;
  } catch (error) {
    return false;
  }
}

export function getCronConfiguration() {
  return {
    production: {
      overdueCheckFirst: {
        schedule: process.env.CRON_OVERDUE_CHECK_FIRST || DEFAULT_SCHEDULES.OVERDUE_CHECK_FIRST,
        enabled: process.env.CRON_OVERDUE_CHECK_FIRST_ENABLED !== 'false',
        isDefault: !process.env.CRON_OVERDUE_CHECK_FIRST
      },
      overdueCheckFinal: {
        schedule: process.env.CRON_OVERDUE_CHECK_FINAL || DEFAULT_SCHEDULES.OVERDUE_CHECK_FINAL,
        enabled: process.env.CRON_OVERDUE_CHECK_FINAL_ENABLED !== 'false',
        isDefault: !process.env.CRON_OVERDUE_CHECK_FINAL
      },
      paymentReminderFirst: {
        schedule: process.env.CRON_PAYMENT_REMINDER_FIRST || DEFAULT_SCHEDULES.PAYMENT_REMINDER_FIRST,
        enabled: process.env.CRON_PAYMENT_REMINDER_FIRST_ENABLED !== 'false',
        isDefault: !process.env.CRON_PAYMENT_REMINDER_FIRST
      },
      paymentReminderFinal: {
        schedule: process.env.CRON_PAYMENT_REMINDER_FINAL || DEFAULT_SCHEDULES.PAYMENT_REMINDER_FINAL,
        enabled: process.env.CRON_PAYMENT_REMINDER_FINAL_ENABLED !== 'false',
        isDefault: !process.env.CRON_PAYMENT_REMINDER_FINAL
      }
    },
    testing: {
      enabled: process.env.CRON_TEST_JOBS_ENABLED === 'true',
      overdueTest: process.env.CRON_TEST_OVERDUE || '*/30 * * * * *',
      reminderTest: process.env.CRON_TEST_REMINDER || '*/45 * * * * *'
    },
    defaults: DEFAULT_SCHEDULES
  };
}