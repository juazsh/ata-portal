import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface IOfferingItem {
  id: string;
  name: string;
  plans?: Array<{
    id: string;
    name: string;
    price: number;
    tax: number;
  }>;
  programs?: Array<{
    id: string;
    name: string;
    price: number;
    tax: number;
  }>;
}

export interface ILocation extends Document {
  id: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phoneNumber: string;
  offerings: IOfferingItem[];
  active: boolean; 
}

const OfferingItemSchema = new Schema<IOfferingItem>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  plans: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    tax: { type: Number, required: true }
  }],
  programs: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    tax: { type: Number, required: true }
  }]
});

const LocationSchema = new Schema<ILocation>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    name: { type: String, required: true, unique: true },
    address1: { type: String, required: true },
    address2: { type: String, required: false },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true, default: 'United States' },
    email: { 
      type: String, 
      required: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please provide a valid email address']
    },
    phoneNumber: { type: String, required: true },
    offerings: [OfferingItemSchema],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Helper methods for location management
LocationSchema.methods.isActive = function(): boolean {
  return this.active === true;
};

LocationSchema.methods.getFullAddress = function(): string {
  let address = this.address1;
  if (this.address2) {
    address += `, ${this.address2}`;
  }
  address += `, ${this.city}, ${this.state} ${this.zip}`;
  if (this.country && this.country !== 'United States') {
    address += `, ${this.country}`;
  }
  return address;
};

LocationSchema.methods.hasOffering = function(offeringId: string): boolean {
  return this.offerings.some(offering => offering.id === offeringId);
};

LocationSchema.methods.getOfferingPricing = function(offeringId: string, itemId: string) {
  const offering = this.offerings.find(o => o.id === offeringId);
  if (!offering) return null;
  
  if (offering.plans) {
    const plan = offering.plans.find(p => p.id === itemId);
    if (plan) return { price: plan.price, tax: plan.tax };
  }
  
  if (offering.programs) {
    const program = offering.programs.find(p => p.id === itemId);
    if (program) return { price: program.price, tax: program.tax };
  }
  
  return null;
};

LocationSchema.index({ name: 1 }, { unique: true });
LocationSchema.index({ state: 1 });
LocationSchema.index({ city: 1 });
LocationSchema.index({ country: 1 });
LocationSchema.index({ active: 1 });
LocationSchema.index({ 'offerings.id': 1 });

LocationSchema.virtual('assignedUsers', {
  ref: 'User',
  localField: 'id',
  foreignField: 'locationId',
  justOne: false
});

LocationSchema.set('toJSON', { virtuals: true });
LocationSchema.set('toObject', { virtuals: true });

export const Location = mongoose.models.Location || mongoose.model<ILocation>('Location', LocationSchema);