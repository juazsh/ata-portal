import { Request, Response } from "express";
import { Program, Offering } from "../models/program";
import mongoose from "mongoose";

export const getAllPrograms = async (req: Request, res: Response) => {
  try {

    const programs = await Program.find()
      .populate("offering", "name type")
      .populate({
        path: "modules",
        select: "name description topics",
        populate: {
          path: "topics",
          select: "name description estimatedDuration",
        },
      });

    res.status(200).json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs", error: (error as Error).message });
  }
};

export const getProgramById = async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ message: "Invalid Program ID format" });
    }

    const program = await Program.findById(programId)
      .populate("offering", "name type")
      .populate({
        path: "modules",
        select: "name description topics",
        populate: {
          path: "topics",
          select: "name description estimatedDuration",
        },
      });

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json(program);
  } catch (error) {
    console.error("Error fetching program by ID:", error);
    res.status(500).json({ message: "Failed to fetch program", error: (error as Error).message });
  }
};

export const addProgram = async (req: Request, res: Response) => {
  try {
    const { name, description, price, estimatedDuration, offering: offeringId, modules } = req.body;

    if (!name || !description || price === undefined || estimatedDuration === undefined || !offeringId) {
      return res.status(400).json({ message: "Missing required fields: name, description, price, estimatedDuration, offering" });
    }

    if (!mongoose.Types.ObjectId.isValid(offeringId)) {
      return res.status(400).json({ message: "Invalid Offering ID format" });
    }

    const offeringExists = await Offering.findById(offeringId);
    if (!offeringExists) {
      return res.status(404).json({ message: `Offering with ID ${offeringId} not found.` });
    }

    const newProgram = new Program({
      name,
      description,
      price,
      estimatedDuration,
      offering: offeringId,
      modules: modules || [],
    });

    const savedProgram = await newProgram.save();

    await Offering.findByIdAndUpdate(offeringId, { $addToSet: { programs: savedProgram._id } });

    const populatedProgram = await Program.findById(savedProgram._id)
      .populate("offering", "name type")
      .populate("modules", "name");

    res.status(201).json(populatedProgram);
  } catch (error) {
    console.error("Error adding program:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to add program", error: (error as Error).message });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ message: "Invalid Program ID format" });
    }

    if (updateData.offering) {
      if (!mongoose.Types.ObjectId.isValid(updateData.offering)) {
        return res.status(400).json({ message: "Invalid Offering ID format in update data" });
      }
      const offeringExists = await Offering.findById(updateData.offering);
      if (!offeringExists) {
        return res.status(404).json({ message: `Offering with ID ${updateData.offering} not found.` });
      }
    }

    const updatedProgram = await Program.findByIdAndUpdate(
      programId,
      updateData,
      { new: true, runValidators: true }
    ).populate("offering", "name type")
      .populate({
        path: "modules",
        select: "name description topics",
        populate: {
          path: "topics",
          select: "name description estimatedDuration",
        },
      });


    if (!updatedProgram) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json(updatedProgram);
  } catch (error) {
    console.error("Error updating program:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update program", error: (error as Error).message });
  }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ message: "Invalid Program ID format" });
    }
    const deletedProgram = await Program.findByIdAndDelete(programId);
    if (!deletedProgram) {
      return res.status(404).json({ message: "Program not found" });
    }
    if (deletedProgram.offering) {
      await Offering.findByIdAndUpdate(deletedProgram.offering, { $pull: { programs: deletedProgram._id } });
    }
    res.status(200).json({ message: "Program deleted successfully", programId: deletedProgram._id });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Failed to delete program", error: (error as Error).message });
  }
};