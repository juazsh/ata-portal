import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  programId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
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