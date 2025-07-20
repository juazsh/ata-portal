import mongoose, { Schema, Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IPlan extends Document {
  id: string;
  name: string;
  description: string;
  stripeProductId?: string;
  paypalProductId?: string;
}

const PlanSchema = new Schema<IPlan>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    stripeProductId: { type: String },
    paypalProductId: { type: String },
  },
  { timestamps: true }
);

export const Plan = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema); 