import mongoose, { Schema, Document } from "mongoose"
import { v4 as uuidv4 } from "uuid"

export interface IOffering extends Document {
  id: string // UUID
  name: string
  description: string
  description2?: string
  plans?: string[] // Array of plan IDs (if name is Marathon)
  programs?: string[] // Array of program IDs (if name is not Marathon)
}

const offeringSchema = new Schema(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    description2: { type: String },
    plans: [{ type: String }], // Array of plan IDs
    programs: [{ type: String }], // Array of program IDs
  },
  { timestamps: true }
)

// Pre-save hook to ensure correct array based on name
offeringSchema.pre("save", function (next) {
  if (this.name === "Marathon") {
    this.programs = undefined // Clear programs array
  } else {
    this.plans = undefined // Clear plans array
  }
  next()
})

export const Offering = mongoose.model<IOffering>("Offering", offeringSchema) 