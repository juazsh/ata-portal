interface OverduePaymentData {
  parentFirstName: string;
  parentLastName: string;
  studentFirstName: string;
  studentLastName: string;
  programName: string;
  monthlyAmount: number;
  nextPaymentDue: Date;
  isFinalNotice: boolean;
  enrollmentId: string;
}

export function getOverduePaymentEmailTemplate(data: OverduePaymentData): string {
  const portalLink = `${process.env.APP_URL}portal-entry/${data.enrollmentId}`;
  const formattedAmount = data.monthlyAmount.toFixed(2);
  const formattedDate = data.nextPaymentDue.toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>STEM Masters - ${data.isFinalNotice ? 'FINAL NOTICE: ' : ''}Payment Overdue</title>
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
          background-color: ${data.isFinalNotice ? '#d32f2f' : '#f57c00'};
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
          background-color: ${data.isFinalNotice ? '#d32f2f' : '#f57c00'};
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
        .urgent-box {
          background-color: ${data.isFinalNotice ? '#ffebee' : '#fff3e0'};
          border-left: 4px solid ${data.isFinalNotice ? '#d32f2f' : '#f57c00'};
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
        <h2>${data.isFinalNotice ? 'FINAL NOTICE' : 'PAYMENT OVERDUE'}</h2>
      </div>
      
      <div class="content">
        <p>Dear ${data.parentFirstName} ${data.parentLastName},</p>
        
        ${data.isFinalNotice ? `
        <div class="urgent-box">
          <h3>⚠️ ENROLLMENT SUSPENDED</h3>
          <p><strong>Your child's enrollment has been suspended due to overdue payment.</strong></p>
          <p>${data.studentFirstName} will not be able to attend classes until this payment is resolved.</p>
        </div>
        ` : `
        <div class="urgent-box">
          <h3>⚠️ PAYMENT OVERDUE</h3>
          <p>We have not received your monthly payment for ${data.studentFirstName}'s enrollment in the ${data.programName} program.</p>
        </div>
        `}
        
        <div class="payment-details">
          <h3>Payment Details</h3>
          <p><strong>Student:</strong> ${data.studentFirstName} ${data.studentLastName}</p>
          <p><strong>Program:</strong> ${data.programName}</p>
          <p><strong>Monthly Amount:</strong> $${formattedAmount}</p>
          <p><strong>Due Date:</strong> ${formattedDate}</p>
          <p><strong>Status:</strong> <span style="color: #d32f2f; font-weight: bold;">OVERDUE</span></p>
        </div>
        
        <h3>Immediate Action Required</h3>
        <p>Please make your payment immediately to ${data.isFinalNotice ? 'reactivate' : 'avoid suspension of'} your child's enrollment.</p>
        
        <a href="${portalLink}" class="button">Make Payment Now</a>
        
        ${data.isFinalNotice ? `
        <p><strong style="color: #d32f2f;">Important:</strong> Until this payment is received, ${data.studentFirstName} cannot attend any classes or access course materials. Please resolve this immediately to minimize disruption to your child's learning.</p>
        ` : `
        <p><strong>Note:</strong> If payment is not received by the 5th of this month, your child's enrollment will be suspended temporarily.</p>
        `}
        
        <p>If you have any questions or need to discuss payment arrangements, please contact us immediately at support@stem-masters.org or call our office.</p>
        
        <p>Best regards,<br>The STEM Masters Team</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} STEM Masters. All rights reserved.</p>
        <p>This is an automated message regarding your account status.</p>
      </div>
    </body>
    </html>
  `;
}