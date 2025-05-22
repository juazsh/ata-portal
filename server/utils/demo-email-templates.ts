interface DemoRegistrationEmailData {
  parentFirstName: string;
  parentLastName: string;
  studentFirstName: string;
  studentLastName: string;
  demoClassDate: string;
  registrationId: string;
}

export function getDemoRegistrationEmailTemplate(data: DemoRegistrationEmailData): string {
  const formattedDate = new Date(data.demoClassDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>STEM Masters - Demo Class Registration Confirmation</title>
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
        .highlight {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          padding: 10px;
          margin: 15px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>STEM Masters</h1>
        <p>Demo Class Registration Confirmation</p>
      </div>
      
      <div class="content">
        <h2>Thank You for Registering!</h2>
        
        <p>Dear ${data.parentFirstName} ${data.parentLastName},</p>
        
        <p>We're excited to confirm your demo class registration for ${data.studentFirstName} ${data.studentLastName} at STEM Masters!</p>
        
        <div class="info-box">
          <h3>Demo Class Details</h3>
          <p><strong>Student Name:</strong> ${data.studentFirstName} ${data.studentLastName}</p>
          <p><strong>Date & Time:</strong> ${formattedDate}</p>
          <p><strong>Registration ID:</strong> ${data.registrationId}</p>
        </div>
        
        <div class="highlight">
          <h3>Important Information</h3>
          <ul>
            <li>Please arrive 10 minutes early</li>
            <li>Parents are welcome to observe the class</li>
            <li>The demo class duration is approximately 1 hour</li>
          </ul>
        </div>
        
        <h3>Location</h3>
        <p>STEM Masters Learning Center<br>
        123 Someplace in Rochester<br>
        Rochester, NY 12345</p>
        
        <h3>Need to Reschedule?</h3>
        <p>If you need to reschedule or cancel your demo class, please contact us at least 24 hours in advance:</p>
        <ul>
          <li>Email: support@stem-masters.org</li>
          <li>Phone: (555) 123-4567</li>
        </ul>
        
        <p>We look forward to meeting ${data.studentFirstName} and introducing them to our exciting STEM programs!</p>
        
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