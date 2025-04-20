import { Request, Response } from "express";
import mongoose from 'mongoose';
import { CompletedTopic, ModuleProgress, ProgramProgress } from './../models/student-progress';
import { Topic, Module, Program } from './../models/program';
import User, { UserRole } from "../models/user";


export const completeStudentTopic = async (req: Request, res: Response) => {
  try {
    const { studentId, topicId } = req.params;
    const { score } = req.body;

    const student = await User.findOne({
      _id: studentId,
      role: UserRole.STUDENT
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (
      req.user?.role !== UserRole.ADMIN &&
      req.user?.role !== UserRole.OWNER &&
      req.user?.role !== UserRole.TEACHER &&
      (req.user?.role === UserRole.PARENT && req.user?.id !== student.parentId.toString())
    ) {
      return res.status(403).json({
        message: "You don't have permission to update this student's progress"
      });
    }

    const result = await markTopicAsCompleted(studentId, topicId, score);

    res.status(200).json({
      message: "Topic marked as completed successfully",
      result
    });
  } catch (error) {
    console.error("Failed to mark topic as completed:", error);
    res.status(500).json({ message: "Failed to mark topic as completed" });
  }
};

export const getStudentProgressHandler = async (req: Request, res: Response) => {
  try {
    console.log("Fetching student progress...");
    const { studentId } = req.params;

    const student = await User.findOne({
      _id: studentId,
      role: UserRole.STUDENT
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (
      req.user?.role !== UserRole.ADMIN &&
      req.user?.role !== UserRole.OWNER &&
      req.user?.role !== UserRole.TEACHER &&
      (req.user?.role === UserRole.PARENT && req.user?.id !== student.parentId.toString())
    ) {
      return res.status(403).json({
        message: "You don't have permission to view this student's progress"
      });
    }

    const progress = await getStudentProgress(studentId);
    console.log("Student progress fetched successfully:", progress);

    res.status(200).json(progress);
  } catch (error) {
    console.error("Failed to get student progress:", error);
    res.status(500).json({ message: "Failed to get student progress" });
  }
};


export async function markTopicAsCompleted(
  studentId: string | mongoose.Types.ObjectId,
  topicId: string | mongoose.Types.ObjectId,
  score?: number
) {
  try {
    const completedTopic = await CompletedTopic.findOneAndUpdate(
      { studentId, topicId },
      {
        completedAt: new Date(),
        score
      },
      { upsert: true, new: true }
    );

    const topic = await Topic.findById(topicId);
    if (!topic || !topic.module) {
      throw new Error('Topic not found or not associated with a module');
    }

    await updateModuleProgress(studentId, topic.module);

    return completedTopic;
  } catch (error) {
    console.error('Error marking topic as completed:', error);
    throw error;
  }
}
async function updateModuleProgress(
  studentId: string | mongoose.Types.ObjectId,
  moduleId: string | mongoose.Types.ObjectId
) {
  try {
    const module = await Module.findById(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    const totalTopics = module.topics.length;
    if (totalTopics === 0) return;

    const completedTopics = await CompletedTopic.find({
      studentId,
      topicId: { $in: module.topics }
    });

    const completedTopicsCount = completedTopics.length;
    const completionPercentage = Math.round((completedTopicsCount / totalTopics) * 100);

    let totalMarks = 0;
    let topicsWithMarks = 0;

    completedTopics.forEach(topic => {
      if (topic.score !== undefined) {
        totalMarks += topic.score;
        topicsWithMarks++;
      }
    });

    const marks = topicsWithMarks > 0 ? Math.round(totalMarks / topicsWithMarks) : 0;

    const moduleProgress = await ModuleProgress.findOneAndUpdate(
      { studentId, moduleId },
      {
        programId: module.program,
        completedTopics: completedTopicsCount,
        totalTopics,
        completionPercentage,
        marks,
        lastUpdatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await updateProgramProgress(studentId, module.program);

    return moduleProgress;
  } catch (error) {
    console.error('Error updating module progress:', error);
    throw error;
  }
}

async function updateProgramProgress(
  studentId: string | mongoose.Types.ObjectId,
  programId: string | mongoose.Types.ObjectId
) {
  try {
    const program = await Program.findById(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    const totalModules = program.modules.length;
    if (totalModules === 0) return;

    const moduleProgressRecords = await ModuleProgress.find({
      studentId,
      programId,
      completionPercentage: 100
    });

    const completedModulesCount = moduleProgressRecords.length;

    const completionPercentage = Math.round((completedModulesCount / totalModules) * 100);

    const programProgress = await ProgramProgress.findOneAndUpdate(
      { studentId, programId },
      {
        completedModules: completedModulesCount,
        totalModules,
        completionPercentage,
        lastUpdatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return programProgress;
  } catch (error) {
    console.error('Error updating program progress:', error);
    throw error;
  }
}

export async function getStudentProgress(studentId: string | mongoose.Types.ObjectId) {
  try {
    const programProgress = await ProgramProgress.find({ studentId })
      .populate({
        path: 'programId',
        select: 'name description'
      });

    const moduleProgress = await ModuleProgress.find({ studentId })
      .populate({
        path: 'moduleId',
        select: 'name description'
      });

    const completedTopics = await CompletedTopic.find({ studentId })
      .select('topicId completedAt score')
      .lean();

    const completedTopicIds = completedTopics.map(topic => topic.topicId.toString());

    return {
      programs: programProgress.map(program => ({
        id: program.programId._id.toString(),
        name: program.programId ? (program.programId as any).name : 'Unknown Program',
        completionPercentage: program.completionPercentage,
        completedModules: program.completedModules,
        totalModules: program.totalModules
      })),
      modules: moduleProgress.map(module => ({
        id: module.moduleId._id.toString(),
        name: module.moduleId ? (module.moduleId as any).name : 'Unknown Module',
        programId: module.programId.toString(),
        completionPercentage: module.completionPercentage,
        completedTopics: module.completedTopics,
        totalTopics: module.totalTopics,
        marks: module.marks
      })),
      completedTopics: completedTopics.map(topic => ({
        topicId: topic.topicId.toString(),
        completedAt: topic.completedAt,
        score: topic.score || 0
      })),
      completedTopicIds
    };
  } catch (error) {
    console.error('Error getting student progress:', error);
    throw error;
  }
}