import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  enrollmentId?: Types.ObjectId;
  amount: number;
  type: 'payment' | 'refund' | 'chargeback' | 'adjustment';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processor: 'stripe' | 'paypal' | 'manual';
  transactionId: string;
  paymentMethodId?: Types.ObjectId;
  date: Date;
  metadata?: Record<string, any>;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['payment', 'refund', 'chargeback', 'adjustment'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], required: true },
  processor: { type: String, enum: ['stripe', 'paypal', 'manual'], required: true },
  transactionId: { type: String, required: true },
  paymentMethodId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  date: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction; 