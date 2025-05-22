interface PasswordResetEmailData {
    firstName: string;
    lastName: string;
    code: string;
    email: string;
  }
  
  export function getPasswordResetEmailTemplate(data: PasswordResetEmailData): string {
    const verifyLink = `${process.env.APP_URL}verify-password?email=${encodeURIComponent(data.email)}&code=${data.code}`;
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>STEM Masters - Password Reset</title>
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
          .code-box {
            background-color: #f5f5f5;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 5px;
          }
          .info-box {
            background-color: #f5f5f5;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>STEM Masters</h1>
          <p>Password Reset Request</p>
        </div>
        
        <div class="content">
          <h2>Password Reset</h2>
          
          <p>Dear ${data.firstName} ${data.lastName},</p>
          
          <p>We received a request to reset your password for your STEM Masters account. If you did not make this request, you can safely ignore this email.</p>
          
          <div class="info-box">
            <p>To reset your password, please use the verification code below or click the button to be directed to our password reset page.</p>
          </div>
          
          <div class="code-box">
            ${data.code}
          </div>
          
          <p style="text-align: center;">
            <a href="${verifyLink}" class="button">Reset Your Password</a>
          </p>
          
          <p>This code will expire in 8 hours for security reasons.</p>
          
          <p>If you're having trouble clicking the button, you can also copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; font-size: 12px;">${verifyLink}</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us at support@stem-masters.org.</p>
          
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