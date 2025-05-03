import PDFDocument from 'pdfkit';
import { IRegistration } from '../models/registration';

export async function generateInvoicePDF(registration: IRegistration): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('STEM Masters', 50, 50)
        .fontSize(10)
        .font('Helvetica')
        .text('Excellence in STEM Education', 50, 80);

      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('REGISTRATION INVOICE', 50, 130);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Invoice Date: ${new Date().toLocaleDateString()}`, 50, 160)
        .text(`Registration ID: ${registration._id}`, 50, 175);


      doc.moveTo(50, 200)
        .lineTo(550, 200)
        .stroke();

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Bill To:', 50, 220);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`${registration.parentFirstName} ${registration.parentLastName}`, 50, 240)
        .text(registration.parentEmail, 50, 255)
        .text(registration.parentPhone, 50, 270);

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Student Information:', 300, 220);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`${registration.studentFirstName} ${registration.studentLastName}`, 300, 240)
        .text(`DOB: ${new Date(registration.studentDOB).toLocaleDateString()}`, 300, 255);


      doc.moveTo(50, 290)
        .lineTo(550, 290)
        .stroke();

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Program Details', 50, 310);


      const tableTop = 340;
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Amount', 450, tableTop, { width: 90, align: 'right' });

      doc.moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();


      let yPosition = tableTop + 30;

      doc.font('Helvetica')
        .text('Program Enrollment', 50, yPosition)
        .text(`$${registration.firstPaymentAmount.toFixed(2)}`, 450, yPosition, { width: 90, align: 'right' });

      yPosition += 20;
      doc.text('Administrative Fee', 50, yPosition)
        .text(`$${registration.adminFee.toFixed(2)}`, 450, yPosition, { width: 90, align: 'right' });

      yPosition += 20;
      doc.text('Tax', 50, yPosition)
        .text(`$${registration.taxAmount.toFixed(2)}`, 450, yPosition, { width: 90, align: 'right' });


      if (registration.discountAmount && registration.discountAmount > 0) {
        yPosition += 20;
        doc.text(`Discount (${registration.discountCode})`, 50, yPosition)
          .text(`-$${registration.discountAmount.toFixed(2)}`, 450, yPosition, { width: 90, align: 'right' });
      }


      doc.moveTo(50, yPosition + 20)
        .lineTo(550, yPosition + 20)
        .stroke();

      yPosition += 35;
      doc.font('Helvetica-Bold')
        .text('Total Due:', 350, yPosition)
        .text(`$${registration.totalAmountDue.toFixed(2)}`, 450, yPosition, { width: 90, align: 'right' });


      yPosition += 40;
      doc.fontSize(12)
        .text('Payment Information', 50, yPosition);

      yPosition += 20;
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Payment Method: ${registration.paymentMethod === 'credit-card' ? 'Credit Card' : 'PayPal'}`, 50, yPosition);

      yPosition += 15;
      doc.text(`Enrollment Date: ${new Date(registration.enrollmentDate).toLocaleDateString()}`, 50, yPosition);


      doc.fontSize(8)
        .font('Helvetica')
        .text('Thank you for choosing STEM Masters!', 50, 750, { align: 'center', width: 500 })
        .text('For questions about this invoice, please contact us at support@stemmasters.com', 50, 765, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}