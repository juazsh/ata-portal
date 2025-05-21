import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IPasswordReset extends Document {
  _id: string;
  email: string;
  code: string;
  isVerified: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    _id: { type: String, default: () => uuidv4() },
    email: { type: String, required: true, index: true },
    code: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true }
  },
  {
    timestamps: true
  }
);

PasswordResetSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 28800
  }
);

export const PasswordReset = mongoose.models.PasswordReset || 
  mongoose.model<IPasswordReset>("PasswordReset", PasswordResetSchema);