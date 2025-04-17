import mongoose, { Schema, Document, Types } from "mongoose";


export interface ITopic extends Document {
  name: string;
  description: string;
  estimatedDuration: number;
  taughtBy?: string;
  module?: Types.ObjectId;
}

const TopicSchema = new Schema<ITopic>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    estimatedDuration: { type: Number, required: true },
    taughtBy: { type: String },
    module: { type: Schema.Types.ObjectId, ref: "Module", required: false },
  },
  { timestamps: true }
);

export interface IModule extends Document {
  name: string;
  description: string;
  estimatedDuration: number;
  program: Types.ObjectId;
  topics: Types.ObjectId[];
}

const ModuleSchema = new Schema<IModule>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    estimatedDuration: { type: Number, required: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    topics: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
  },
  { timestamps: true }
);

export interface IProgram extends Document {
  name: string;
  description: string;
  price: number;
  estimatedDuration: number;
  offering: Types.ObjectId;
  modules: Types.ObjectId[];
}

const ProgramSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedDuration: { type: Number, required: true },
    offering: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    modules: [{ type: Schema.Types.ObjectId, ref: "Module" }],
  },
  { timestamps: true }
);

export interface IOffering extends Document {
  name: string;
  description: string;
  estimatedDuration: number;
  programs: Types.ObjectId[];
}

const OfferingSchema = new Schema<IOffering>(
  {
    name: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    estimatedDuration: { type: Number, required: true },
    programs: [{ type: Schema.Types.ObjectId, ref: "Program" }],
  },
  { timestamps: true }
);

export const Topic = mongoose.models.Topic || mongoose.model<ITopic>("Topic", TopicSchema);
export const Module = mongoose.models.Module || mongoose.model<IModule>("Module", ModuleSchema);
export const Program = mongoose.models.Program || mongoose.model<IProgram>("Program", ProgramSchema);
export const Offering = mongoose.models.Offering || mongoose.model<IOffering>("Offering", OfferingSchema);
