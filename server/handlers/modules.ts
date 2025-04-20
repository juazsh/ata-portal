import { Request, Response } from "express";
import { Module, Program, Topic } from "../models/program";
import mongoose from "mongoose";

export const getAllModules = async (req: Request, res: Response) => {
  try {
    const modules = await Module.find()
      .populate("program", "name")
      .populate("topics", "name description estimatedDuration");

    res.status(200).json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ message: "Failed to fetch modules", error: (error as Error).message });
  }
};

export const getModuleById = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ message: "Invalid Module ID format" });
    }

    const module = await Module.findById(moduleId)
      .populate("program", "name")
      .populate("topics", "name description estimatedDuration");

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    res.status(200).json(module);
  } catch (error) {
    console.error("Error fetching module by ID:", error);
    res.status(500).json({ message: "Failed to fetch module", error: (error as Error).message });
  }
};

export const getModulesByProgram = async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ message: "Invalid Program ID format" });
    }

    const modules = await Module.find({ program: programId })
      .populate("topics", "name description estimatedDuration");

    res.status(200).json(modules);
  } catch (error) {
    console.error("Error fetching modules by program:", error);
    res.status(500).json({ message: "Failed to fetch modules", error: (error as Error).message });
  }
};

export const addModule = async (req: Request, res: Response) => {
  try {
    const { name, description, estimatedDuration, program: programId, topics } = req.body;

    if (!name || !description || estimatedDuration === undefined || !programId) {
      return res.status(400).json({
        message: "Missing required fields: name, description, estimatedDuration, program"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ message: "Invalid Program ID format" });
    }

    const programExists = await Program.findById(programId);
    if (!programExists) {
      return res.status(404).json({ message: `Program with ID ${programId} not found.` });
    }

    const newModule = new Module({
      name,
      description,
      estimatedDuration,
      program: programId,
      topics: topics || [],
    });

    const savedModule = await newModule.save();

    await Program.findByIdAndUpdate(programId, { $addToSet: { modules: savedModule._id } });

    const populatedModule = await Module.findById(savedModule._id)
      .populate("program", "name")
      .populate("topics", "name");

    res.status(201).json(populatedModule);
  } catch (error) {
    console.error("Error adding module:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to add module", error: (error as Error).message });
  }
};

export const updateModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ message: "Invalid Module ID format" });
    }

    if (updateData.program) {
      if (!mongoose.Types.ObjectId.isValid(updateData.program)) {
        return res.status(400).json({ message: "Invalid Program ID format in update data" });
      }
      const programExists = await Program.findById(updateData.program);
      if (!programExists) {
        return res.status(404).json({ message: `Program with ID ${updateData.program} not found.` });
      }
    }

    const currentModule = await Module.findById(moduleId);
    if (!currentModule) {
      return res.status(404).json({ message: "Module not found" });
    }

    if (updateData.program && updateData.program.toString() !== currentModule.program.toString()) {
      await Program.findByIdAndUpdate(currentModule.program, {
        $pull: { modules: moduleId }
      });

      await Program.findByIdAndUpdate(updateData.program, {
        $addToSet: { modules: moduleId }
      });
    }

    const updatedModule = await Module.findByIdAndUpdate(
      moduleId,
      updateData,
      { new: true, runValidators: true }
    ).populate("program", "name")
      .populate("topics", "name description estimatedDuration");

    res.status(200).json(updatedModule);
  } catch (error) {
    console.error("Error updating module:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update module", error: (error as Error).message });
  }
};

export const deleteModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ message: "Invalid Module ID format" });
    }

    const deletedModule = await Module.findByIdAndDelete(moduleId);
    if (!deletedModule) {
      return res.status(404).json({ message: "Module not found" });
    }

    if (deletedModule.program) {
      await Program.findByIdAndUpdate(deletedModule.program, {
        $pull: { modules: deletedModule._id }
      });
    }


    await Topic.updateMany(
      { module: moduleId },
      { $unset: { module: "" } }
    );

    res.status(200).json({ message: "Module deleted successfully", moduleId: deletedModule._id });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ message: "Failed to delete module", error: (error as Error).message });
  }
};