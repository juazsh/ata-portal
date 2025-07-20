import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export interface ISession extends Document {
  id: string;
  name: string;
  day: DayOfWeek;
  start_time: string;
  end_time: string;
}

const SessionSchema = new Schema<ISession>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    name: { type: String, required: true },
    day: {
      type: String,
      enum: Object.values(DayOfWeek),
      required: true
    },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true }
  },
  { timestamps: true }
);

SessionSchema.index(
  { day: 1, start_time: 1, end_time: 1 },
  { unique: true }
);

export const Session = mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema); 