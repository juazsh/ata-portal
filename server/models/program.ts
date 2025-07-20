import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Offering } from "./offering";

export interface ITopic extends Document {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  taughtBy?: string;
  module?: string;
}

const topicSchema = new Schema<ITopic>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    estimatedDuration: { type: Number, required: true },
    taughtBy: { type: String },
    module: { type: String, required: false },
  },
  { timestamps: true }
);

export interface IModule extends Document {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  program: string;
  topics: string[];
}

const moduleSchema = new Schema<IModule>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    estimatedDuration: { type: Number, required: true },
    program: { type: String, required: true },
    topics: [{ type: String }],
  },
  { timestamps: true }
);

export interface IProgram extends Document {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  image?: string;
  offering: string;
  modules: string[];
  stripeProductId?: string;
  paypalProductId?: string;
  googleClassroomLink?: string;
}

const programSchema = new Schema<IProgram>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    estimatedDuration: { type: Number, required: true },
    image: { type: String },
    offering: { type: String, required: true },
    modules: [{ type: String }],
    stripeProductId: { type: String },
    paypalProductId: { type: String },
    googleClassroomLink: { type: String },
  },
  { timestamps: true }
);

programSchema.pre("save", async function (next) {
  try {
    const offering = await Offering.findOne({ id: this.get("offering") });
    
    if (!offering) {
      throw new Error("Offering not found");
    }
    
    if (offering.name === "Marathon") {
      throw new Error("Programs cannot be associated with Marathon offerings");
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const Topic = mongoose.model<ITopic>("Topic", topicSchema);
export const Module = mongoose.model<IModule>("Module", moduleSchema);
export const Program = mongoose.model<IProgram>("Program", programSchema);
