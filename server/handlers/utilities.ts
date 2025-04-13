import { Request, Response } from 'express';
import { sendMail } from 'server/services/email';

interface ATAResponse {
  data: object;
  message: string;
  success: boolean;
}
interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}
export const handleContactUs = async (req: Request, res: Response<ATAResponse>) => {
  try {
    const { name, email, phone, message }: ContactForm = req.body;
    if (!name || !email || !phone || !message) {
      res.status(400).json({ data: {}, message: 'All fields are required', success: false });
      return;
    }
    const text = `A user with the following details contacted us via the website:
    - Name: ${name}
    - Email: ${email}
    - Phone: ${phone}
    - Message: ${message}`;
    await sendMail(email, 'Enquiry from a user', text);
    res.status(200).json({ data: {}, message: "Thanks for reaching. Someone will contact you soon.", success: true })
  } catch (err: Error | any) {
    res.status(500).json({ data: {}, message: err.message, success: false })
  }
}