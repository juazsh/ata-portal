import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IEnrollment extends Document {
  id: string;
  programId: string;
  studentId: string;
  parentId: string;
  subscriptionId?: string;

  offeringType: 'Marathon' | 'Sprint';
  classSessions: string[];

  discountCode?: string;
  discountPercent?: number;
  adminPercent: number;
  taxPercent: number;

  lastAmountPaid: number;
  lastPaymentDate?: Date;
  lastPaymentTransactionId?: string;
  lastPaymentMethod: string;
  lastPaymentStatus: string;
  monthlyPaymentReceived: boolean;
  
  autoPayEnabled?: boolean;
  nextPaymentDueDate?: Date;
  monthlyDueAmount?: number;

  paymentHistory?: {
    amount: number;
    date: Date;
    status: string;
    processor: string;
    transactionId: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    programId: {
      type: String,
      required: true
    },
    studentId: {
      type: String,
      required: true
    },
    parentId: {
      type: String,
      required: true
    },
    subscriptionId: {
      type: String,
      required: function () { return this.offeringType === 'Marathon'; }
    },
    offeringType: {
      type: String,
      enum: ['Marathon', 'Sprint'],
      required: true
    },
    classSessions: [{
      type: String,
      required: true
    }],
    discountCode: {
      type: String,
      required: false
    },
    discountPercent: {
      type: Number,
      required: false
    },
    adminPercent: {
      type: Number,
      required: true
    },
    taxPercent: {
      type: Number,
      required: true
    },
    lastAmountPaid: {
      type: Number,
      required: true
    },
    lastPaymentDate: {
      type: Date,
      required: false
    },
    lastPaymentTransactionId: {
      type: String,
      required: false
    },
    lastPaymentMethod: {
      type: String,
      required: true
    },
    lastPaymentStatus: {
      type: String,
      required: true
    },
    monthlyPaymentReceived: {
      type: Boolean,
      default: false,
      required: function () { return this.offeringType === 'Marathon'; }
    },
    autoPayEnabled: {
      type: Boolean,
      required: false, 
      default: false
    },
    nextPaymentDueDate: {
      type: Date,
      required: function () { return this.offeringType === 'Marathon'; }
    },
    monthlyDueAmount: {
      type: Number,
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
      processor: { type: String, required: true },
      transactionId: { type: String, required: true }
    }]
  },
  { timestamps: true }
);

const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;