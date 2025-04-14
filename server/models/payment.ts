import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  last4: string;
  expirationDate: string;
  cardType: string;
  isDefault: boolean;
  stripePaymentMethodId: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    last4: {
      type: String,
      required: true
    },
    expirationDate: {
      type: String,
      required: true
    },
    cardType: {
      type: String,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    stripePaymentMethodId: {
      type: String,
      required: true,
      unique: true
    }
  },
  { timestamps: true }
);

const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;