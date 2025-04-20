import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICompletedTopic extends Document {
  studentId: Types.ObjectId;
  topicId: Types.ObjectId;
  completedAt: Date;
  score?: number;
}

const CompletedTopicSchema = new Schema<ICompletedTopic>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number
    }
  },
  { timestamps: true }
);

CompletedTopicSchema.index({ studentId: 1, topicId: 1 }, { unique: true });

export interface IModuleProgress extends Document {
  studentId: Types.ObjectId;
  moduleId: Types.ObjectId;
  programId: Types.ObjectId;
  completedTopics: number;
  totalTopics: number;
  completionPercentage: number;
  lastUpdatedAt: Date;
  marks: number;
}

const ModuleProgressSchema = new Schema<IModuleProgress>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true
    },
    completedTopics: {
      type: Number,
      default: 0
    },
    totalTopics: {
      type: Number,
      required: true
    },
    completionPercentage: {
      type: Number,
      default: 0
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    },
    marks: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

ModuleProgressSchema.index({ studentId: 1, moduleId: 1 }, { unique: true });

export interface IProgramProgress extends Document {
  studentId: Types.ObjectId;
  programId: Types.ObjectId;
  completedModules: number;
  totalModules: number;
  completionPercentage: number;
  lastUpdatedAt: Date;
}

const ProgramProgressSchema = new Schema<IProgramProgress>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true
    },
    completedModules: {
      type: Number,
      default: 0
    },
    totalModules: {
      type: Number,
      required: true
    },
    completionPercentage: {
      type: Number,
      default: 0
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

ProgramProgressSchema.index({ studentId: 1, programId: 1 }, { unique: true });

export const CompletedTopic = mongoose.models.CompletedTopic || mongoose.model<ICompletedTopic>("CompletedTopic", CompletedTopicSchema);
export const ModuleProgress = mongoose.models.ModuleProgress || mongoose.model<IModuleProgress>("ModuleProgress", ModuleProgressSchema);
export const ProgramProgress = mongoose.models.ProgramProgress || mongoose.model<IProgramProgress>("ProgramProgress", ProgramProgressSchema);