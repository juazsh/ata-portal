import mongoose, { Schema, Document, Types } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

export enum UsageType {
  SINGLE = 'single',
  MULTIPLE = 'multiple'
}

export interface IDiscountCode extends Document {
  id: string;
  code: string;
  usage: UsageType;
  percent: number;
  expireDate: Date;
  locationId: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  description?: string;
  maxUses?: number;
  currentUses: number;
}

const DiscountCodeSchema = new Schema<IDiscountCode>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Discount code cannot exceed 20 characters']
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
      required: true,
      validate: {
        validator: function(date: Date) {
          return date > new Date();
        },
        message: 'Expire date must be in the future'
      }
    },
    locationId: {
      type: String,
      required: true,
      ref: 'Location'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    maxUses: {
      type: Number,
      min: [1, 'Max uses must be at least 1'],
      validate: {
        validator: function(value: number) {
          return this.usage === UsageType.MULTIPLE ? value >= 1 : true;
        },
        message: 'Max uses is required for multiple use discount codes'
      }
    },
    currentUses: {
      type: Number,
      default: 0,
      min: [0, 'Current uses cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
DiscountCodeSchema.index({ code: 1 });
DiscountCodeSchema.index({ locationId: 1 });
DiscountCodeSchema.index({ expireDate: 1 });
DiscountCodeSchema.index({ createdBy: 1 });
DiscountCodeSchema.index({ isActive: 1 });
DiscountCodeSchema.index({ locationId: 1, isActive: 1 });

// Virtual to check if discount code is expired
DiscountCodeSchema.virtual('isExpired').get(function() {
  return new Date() > this.expireDate;
});

// Virtual to check if discount code is still usable
DiscountCodeSchema.virtual('isUsable').get(function() {
  if (!this.isActive || this.isExpired) {
    return false;
  }
  
  if (this.usage === UsageType.SINGLE) {
    return this.currentUses === 0;
  }
  
  return !this.maxUses || this.currentUses < this.maxUses;
});

// Method to increment usage
DiscountCodeSchema.methods.incrementUsage = function() {
  this.currentUses += 1;
  return this.save();
};

// Method to check if code can be used
DiscountCodeSchema.methods.canBeUsed = function(): boolean {
  return this.isUsable;
};

DiscountCodeSchema.set('toJSON', { virtuals: true });
DiscountCodeSchema.set('toObject', { virtuals: true });

export const DiscountCode = mongoose.models.DiscountCode || mongoose.model<IDiscountCode>('DiscountCode', DiscountCodeSchema);

export default DiscountCode;