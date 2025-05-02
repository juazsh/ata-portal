import mongoose, { Schema, Document, Types } from "mongoose";

export enum UsageType {
  SINGLE = 'single',
  MULTIPLE = 'multiple'
}

export interface IDiscountCode extends Document {
  code: string;
  usage: UsageType;
  percent: number;
  expireDate: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const DiscountCodeSchema = new Schema<IDiscountCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    usage: {
      type: String,
      enum: Object.values(UsageType),
      default: UsageType.SINGLE,
      required: true
    },
    percent: {
      type: Number,
      required: true,
      min: [1, 'Discount percentage must be at least 1'],
      max: [100, 'Discount percentage cannot exceed 100']
    },
    expireDate: {
      type: Date,
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

DiscountCodeSchema.index({ code: 1 });
DiscountCodeSchema.index({ expireDate: 1 });
DiscountCodeSchema.index({ createdBy: 1 });

export const DiscountCode = mongoose.models.DiscountCode || mongoose.model<IDiscountCode>('DiscountCode', DiscountCodeSchema);

export default DiscountCode;