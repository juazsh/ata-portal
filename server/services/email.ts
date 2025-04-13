import nodemailer from 'nodemailer';

import SMTPTransport from 'nodemailer/lib/smtp-transport';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: true,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD
  }
} as SMTPTransport.Options);

export const sendMail = async (to: string, subject: string, emailBody: string) => {
  const mailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to,
    subject,
    html: emailBody
  }
  await transporter.sendMail(mailOptions, (error: any, info: any) => {
    console.log(error)
    console.log(info)
  })
}