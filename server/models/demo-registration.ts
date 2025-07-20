import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

export interface IDemoRegistration extends Document {
  id: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;

  studentFirstName: string;
  studentLastName: string;
  studentDOB: Date;

  demoClassDate: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";

  notes?: string;
  attendanceMarked?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const DemoRegistrationSchema = new Schema<IDemoRegistration>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    parentFirstName: { type: String, required: true },
    parentLastName: { type: String, required: true },
    parentEmail: { type: String, required: true },
    parentPhone: { type: String, required: true },

    studentFirstName: { type: String, required: true },
    studentLastName: { type: String, required: true },
    studentDOB: { type: Date, required: true },

    demoClassDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending"
    },

    notes: { type: String },
    attendanceMarked: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

DemoRegistrationSchema.index({ parentEmail: 1 });
DemoRegistrationSchema.index({ demoClassDate: 1 });
DemoRegistrationSchema.index({ status: 1 });

export const DemoRegistration = mongoose.models.DemoRegistration ||
  mongoose.model<IDemoRegistration>("DemoRegistration", DemoRegistrationSchema);