import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

export enum SessionStatus {
  ACTIVE = 'active',
  RUNNING = 'running',
  CANCELLED = 'cancelled',
  CLOSED = 'closed'
}

export interface IWeeklyCalendar extends Document {
  id: string;
  locationId: string;
  classId: string;
  sessionId: string;
  sessionTotalCapacity: number;
  sessionAvailableCapacity: number;
  sessionTotalDemoCapacity: number;
  sessionAvailableDemoCapacity: number;
  sessionType: string;
  sessionStatus: SessionStatus;
  sessionActualAttendance: number;
}

const WeeklyCalendarSchema = new Schema<IWeeklyCalendar>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    locationId: { type: String, required: true },
    classId: { type: String, required: true },
    sessionId: { type: String, required: true },
    sessionTotalCapacity: { type: Number, required: true },
    sessionAvailableCapacity: { type: Number, required: true },
    sessionTotalDemoCapacity: { type: Number, required: true },
    sessionAvailableDemoCapacity: { type: Number, required: true },
    sessionType: { type: String, required: true },
    sessionStatus: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.ACTIVE,
      required: true
    },
    sessionActualAttendance: {
      type: Number,
      default: 0,
      required: true,
      min: [0, 'Attendance cannot be negative']
    }
  },
  { timestamps: true }
);

WeeklyCalendarSchema.index({ locationId: 1 });
WeeklyCalendarSchema.index({ classId: 1 });
WeeklyCalendarSchema.index({ sessionId: 1 });
WeeklyCalendarSchema.index({ sessionType: 1 });
WeeklyCalendarSchema.index({ sessionStatus: 1 });

export const WeeklyCalendar = mongoose.models.WeeklyCalendar || mongoose.model<IWeeklyCalendar>('WeeklyCalendar', WeeklyCalendarSchema); 