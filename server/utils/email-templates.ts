interface RegistrationEmailData {
  parentFirstName: string;
  parentLastName: string;
  studentFirstName: string;
  studentLastName: string;
  registrationId: string;
  parentEmail: string;
}

export function getRegistrationEmailTemplate(data: RegistrationEmailData): string {
  const portalLink = `${process.env.APP_URL}portal-entry/${data.registrationId}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>STEM Masters - Registration Confirmation</title>
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
        <p>Excellence in STEM Education</p>
      </div>
      
      <div class="content">
        <h2>Registration Confirmation</h2>
        
        <p>Dear ${data.parentFirstName} ${data.parentLastName},</p>
        
        <p>Thank you for registering ${data.studentFirstName} ${data.studentLastName} with STEM Masters! We're excited to have your child join our learning community.</p>
        
        <div class="info-box">
          <h3>Registration Details</h3>
          <p><strong>Registration ID:</strong> ${data.registrationId}</p>
          <p><strong>Parent Name:</strong> ${data.parentFirstName} ${data.parentLastName}</p>
          <p><strong>Student Name:</strong> ${data.studentFirstName} ${data.studentLastName}</p>
        </div>
        
        <h3>Next Steps</h3>
        <p>To access your parent portal and manage your enrollment, please create your account:</p>
        
        <a href="${portalLink}" class="button">Create Portal Account</a>
        
        <p>Through the parent portal, you can:</p>
        <ul>
          <li>View class schedules and assignments</li>
          <li>Track your child's progress</li>
          <li>Communicate with instructors</li>
          <li>Manage payments and enrollment</li>
        </ul>
        
        <p>Your registration invoice is attached to this email for your records.</p>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact us at support@stemmasters.com.</p>
        
        <p>Best regards,<br>The STEM Masters Team</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} STEM Masters. All rights reserved.</p>
        <p>This is an automated message, please do not reply directly to this email.</p>
      </div>
    </body>
    </html>
  `;
}