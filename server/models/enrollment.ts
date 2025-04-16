import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  programId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  programFee: number;
  adminFee: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentPlan: string;
  installments?: number;
  subscriptionId: string; // >> if using Stripe Subscriptions
  nextPaymentDue: Date;
  installmentAmount: number;
  installmentsPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    programFee: { type: Number, required: true },
    adminFee: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['paypal', 'credit-card'],
      required: true
    },
    paymentPlan: {
      type: String,
      enum: ['monthly', 'one-time'],
      required: true
    },
    installments: {
      type: Number,
      required: function () { return this.paymentPlan === 'monthly'; }
    },
    subscriptionId: { type: String },
    installmentAmount: { type: Number },
    installmentsPaid: { type: Number },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;
