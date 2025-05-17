import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClassSession extends Document {
  id: string;
  program_id?: Types.ObjectId;
  weekday: string;
  start_time: string;
  end_time: string;
  type: "weekday" | "weekend";
  total_capacity: number;
  available_capacity: number;
  total_demo_capacity: number;
  available_demo_capacity: number;
}

const ClassSessionSchema = new Schema<IClassSession>(
  {
    id: { type: String, required: true, unique: true },
    program_id: { type: Schema.Types.ObjectId, ref: "Program", required: false },
    weekday: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    type: { type: String, enum: ["weekday", "weekend"], required: true },
    total_capacity: { type: Number, required: true },
    available_capacity: { type: Number, required: true },
    total_demo_capacity: { type: Number, required: true },
    available_demo_capacity: { type: Number, required: true }
  },
  { timestamps: true }
);

ClassSessionSchema.index({ program_id: 1, weekday: 1, start_time: 1, end_time: 1 }, { unique: true });

export const ClassSession = mongoose.models.ClassSession ||
  mongoose.model<IClassSession>("ClassSession", ClassSessionSchema);