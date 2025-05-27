interface PaymentReminderData {
  parentFirstName: string;
  parentLastName: string;
  studentFirstName: string;
  studentLastName: string;
  programName: string;
  monthlyAmount: number;
  nextPaymentDue: Date;
  hasAutoPay: boolean;
  isSecondReminder: boolean;
  enrollmentId: string;
}


export function getPaymentReminderEmailTemplate(data: PaymentReminderData): string {
  const portalLink = `${process.env.APP_URL}portal-entry/${data.enrollmentId}`;
  const formattedAmount = data.monthlyAmount.toFixed(2);
  const nextMonthName = data.nextPaymentDue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>STEM Masters - Payment Reminder</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #1a1a1a;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .info-box {
          background-color: #e3f2fd;
          border-left: 4px solid #2196F3;
          padding: 15px;
          margin: 20px 0;
        }
        .payment-details {
          background-color: #f5f5f5;
          border-left: 4px solid #4CAF50;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>STEM Masters</h1>
        <p>${data.isSecondReminder ? 'Final Payment Reminder' : 'Upcoming Payment Reminder'}</p>
      </div>
      
      <div class="content">
        <p>Dear ${data.parentFirstName} ${data.parentLastName},</p>
        
        <p>This is a ${data.isSecondReminder ? 'final ' : ''}friendly reminder about ${data.studentFirstName}'s upcoming monthly payment for the ${data.programName} program.</p>
        
        <div class="payment-details">
          <h3>Payment Details</h3>
          <p><strong>Student:</strong> ${data.studentFirstName} ${data.studentLastName}</p>
          <p><strong>Program:</strong> ${data.programName}</p>
          <p><strong>Monthly Amount:</strong> $${formattedAmount}</p>
          <p><strong>Payment Period:</strong> ${nextMonthName}</p>
        </div>
        
        ${data.hasAutoPay ? `
        <div class="info-box">
          <h3>🔄 Auto-Pay Enabled</h3>
          <p>Your payment will be automatically processed from your saved payment method. No action is required on your part.</p>
          <p>The payment will be deducted around the 1st of ${nextMonthName}.</p>
        </div>
        ` : `
        <div class="info-box">
          <h3>💳 Manual Payment Required</h3>
          <p>Please ensure your payment is made by the 1st of ${nextMonthName} to avoid any interruption to ${data.studentFirstName}'s classes.</p>
        </div>
        
        <a href="${portalLink}" class="button">Make Payment</a>
        `}
        
        ${data.isSecondReminder ? `
        <p><strong>Important:</strong> This is your final reminder. Please ensure payment is completed soon to avoid any disruption to your child's enrollment.</p>
        ` : ''}
        
        <h3>Need Help?</h3>
        <ul>
          <li>Update your payment method in the parent portal</li>
          <li>Set up automatic payments for convenience</li>
          <li>Contact us for payment assistance or questions</li>
        </ul>
        
        <p>Thank you for being part of the STEM Masters family. If you have any questions, please don't hesitate to reach out to us at support@stem-masters.org.</p>
        
        <p>Best regards,<br>The STEM Masters Team</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} STEM Masters. All rights reserved.</p>
        <p>This is an automated payment reminder.</p>
      </div>
    </body>
    </html>
  `;
}