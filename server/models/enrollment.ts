import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  programId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  programFee: number;
  adminFee: number;
  taxAmount: number;
  totalAmount: number;
  offeringType: 'Marathon' | 'Sprint';
  paymentMethod: string;
  paymentStatus: string;
  monthlyAmount?: number;
  subscriptionId?: string;
  nextPaymentDue?: Date;
  paymentHistory?: {
    amount: number;
    date: Date;
    status: string;
    transactionId: string;
  }[];
  paymentDate?: Date;
  paymentTransactionId?: string;
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
    offeringType: {
      type: String,
      enum: ['Marathon', 'Sprint'],
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['paypal', 'credit-card'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'active', 'cancelled'],
      default: 'pending'
    },

    // >> For Marathon (subscription)
    monthlyAmount: {
      type: Number,
      required: function () { return this.offeringType === 'Marathon'; }
    },
    subscriptionId: {
      type: String,
      required: function () { return this.offeringType === 'Marathon'; }
    },
    nextPaymentDue: {
      type: Date,
      required: function () { return this.offeringType === 'Marathon'; }
    },
    paymentHistory: [{
      amount: { type: Number, required: true },
      date: { type: Date, required: true, default: Date.now },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        required: true
      },
      transactionId: { type: String, required: true }
    }],
    paymentDate: {
      type: Date,
      required: function () { return this.offeringType === 'Sprint'; }
    },
    paymentTransactionId: {
      type: String,
      required: function () { return this.offeringType === 'Sprint'; }
    }
  },
  { timestamps: true }
);

const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;
