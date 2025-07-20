import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ISchedule extends Document {
  id: string;
  date: Date;
  totalCapacity: number;
  demoCapacity: number;
  availableCapacity: number;
  availableDemoCapacity: number;
  locationId: string;
  sessionId: string;
  programId?: string;
  planId?: string;
  active: boolean;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    date: { type: Date, required: true },
    totalCapacity: { 
      type: Number, 
      required: true,
      min: [1, 'Total capacity must be at least 1']
    },
    demoCapacity: { 
      type: Number, 
      required: true,
      min: [0, 'Demo capacity cannot be negative']
    },
    availableCapacity: { 
      type: Number, 
      required: true,
      min: [0, 'Available capacity cannot be negative']
    },
    availableDemoCapacity: { 
      type: Number, 
      required: true,
      min: [0, 'Available demo capacity cannot be negative']
    },
    locationId: { 
      type: String, 
      required: true,
      ref: 'Location'
    },
    sessionId: { 
      type: String, 
      required: true,
      ref: 'Session'
    },
    programId: { 
      type: String, 
      required: false,
      ref: 'Program'
    },
    planId: { 
      type: String, 
      required: false,
      ref: 'Plan'
    },
    active: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);


ScheduleSchema.pre('save', function (next) {
  if (this.programId && this.planId) {
    return next(new Error('Schedule cannot have both programId and planId'));
  }
  
  if (!this.programId && !this.planId) {
    return next(new Error('Schedule must have either programId or planId'));
  }
  
  if (this.availableCapacity > this.totalCapacity) {
    return next(new Error('Available capacity cannot exceed total capacity'));
  }
  
  if (this.availableDemoCapacity > this.demoCapacity) {
    return next(new Error('Available demo capacity cannot exceed demo capacity'));
  }
  
  next();
});

ScheduleSchema.index(
  { locationId: 1, sessionId: 1, date: 1, programId: 1 },
  { 
    unique: true,
    partialFilterExpression: { programId: { $exists: true } }
  }
);

ScheduleSchema.index(
  { locationId: 1, sessionId: 1, date: 1, planId: 1 },
  { 
    unique: true,
    partialFilterExpression: { planId: { $exists: true } }
  }
);

ScheduleSchema.index({ locationId: 1, date: 1 });
ScheduleSchema.index({ date: 1 });
ScheduleSchema.index({ active: 1 });
ScheduleSchema.index({ sessionId: 1 });

ScheduleSchema.methods.isFullyBooked = function(): boolean {
  return this.availableCapacity === 0;
};

ScheduleSchema.methods.isDemoFullyBooked = function(): boolean {
  return this.availableDemoCapacity === 0;
};

ScheduleSchema.methods.hasAvailableSlots = function(): boolean {
  return this.availableCapacity > 0 || this.availableDemoCapacity > 0;
};

ScheduleSchema.methods.getBookedCapacity = function(): number {
  return this.totalCapacity - this.availableCapacity;
};

ScheduleSchema.methods.getBookedDemoCapacity = function(): number {
  return this.demoCapacity - this.availableDemoCapacity;
};

ScheduleSchema.methods.bookSlot = function(isDemo: boolean = false): boolean {
  if (isDemo) {
    if (this.availableDemoCapacity > 0) {
      this.availableDemoCapacity--;
      return true;
    }
  } else {
    if (this.availableCapacity > 0) {
      this.availableCapacity--;
      return true;
    }
  }
  return false;
};

ScheduleSchema.methods.cancelSlot = function(isDemo: boolean = false): boolean {
  if (isDemo) {
    if (this.availableDemoCapacity < this.demoCapacity) {
      this.availableDemoCapacity++;
      return true;
    }
  } else {
    if (this.availableCapacity < this.totalCapacity) {
      this.availableCapacity++;
      return true;
    }
  }
  return false;
};

ScheduleSchema.methods.isMarathonSchedule = function(): boolean {
  return !!this.planId;
};

ScheduleSchema.methods.isSprintSchedule = function(): boolean {
  return !!this.programId;
};

export const Schedule = mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);