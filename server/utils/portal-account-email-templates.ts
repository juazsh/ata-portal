interface PortalAccountEmailData {
  parentFirstName: string;
  parentLastName: string;
  studentFirstName: string;
  studentLastName: string;
  studentUsername: string;
  studentEmail: string;
  registrationId: string;
}

export function getPortalAccountEmailTemplate(data: PortalAccountEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>STEM Masters - Portal Account Created</title>
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
        .warning-box {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .credentials {
          background-color: #e8f5e9;
          border: 1px solid #c8e6c9;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>STEM Masters</h1>
        <p>Portal Account Successfully Created</p>
      </div>
      
      <div class="content">
        <h2>Welcome to STEM Masters!</h2>
        
        <p>Dear ${data.parentFirstName} ${data.parentLastName},</p>
        
        <p>Your portal accounts have been successfully created. You can now access the STEM Masters learning platform.</p>
        
        <div class="info-box">
          <h3>Parent Account Login</h3>
          <p>You can log in using the email address and password you created during registration.</p>
          <p><strong>Email:</strong> Use the email address you registered with</p>
        </div>
        
        <div class="credentials">
          <h3>Student Account Login Details</h3>
          <p><strong>Student Name:</strong> ${data.studentFirstName} ${data.studentLastName}</p>
          <p><strong>Username:</strong> ${data.studentUsername}</p>
          <p><strong>Email:</strong> ${data.studentEmail}</p>
          <p><strong>Temporary Password:</strong> Same as parent password</p>
        </div>
        
        <div class="warning-box">
          <h3>Important Security Notice</h3>
          <p>For security reasons, we strongly recommend that your student changes their password after their first login. The student can log in using either their username or email address.</p>
        </div>
        
        <h3>Next Steps</h3>
        <ol>
          <li>Log in to the parent portal to manage your account and view progress</li>
          <li>Have your student log in and change their password</li>
          <li>Explore the learning materials and get started with the program</li>
        </ol>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <a href="https://app.stem-masters.org/auth" class="button">Go to Login Page</a>
        
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