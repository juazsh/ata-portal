import { Request, Response } from "express";
import { Program } from "../models/program";
import { Offering } from "../models/offering";
import { Module } from "../models/program";
import mongoose from "mongoose";

export const getAllPrograms = async (req: Request, res: Response) => {
  try {
    const { offeringType, offering } = req.query;
    let query;

    if (offeringType) {
      const offerings = await Offering.find({ name: offeringType });
      const offeringIds = offerings.map(o => o.id);
      query = Program.find({ offering: { $in: offeringIds } });
    } else if (offering) {
      query = Program.find({ offering });
    } else {
      query = Program.find();
    }

    const programs = await query
      .select("id name description estimatedDuration image offering modules stripeProductId paypalProductId googleClassroomLink")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({
      message: "Failed to fetch programs",
      error: (error as Error).message,
    });
  }
};

export const getProgramById = async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;

    if (!programId) {
      return res.status(400).json({ message: "Program ID is required" });
    }

    const program = await Program.findOne({ id: programId })
      .select("id name description estimatedDuration image offering modules stripeProductId paypalProductId googleClassroomLink")
      .lean();

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({
      message: "Failed to fetch program",
      error: (error as Error).message,
    });
  }
};

export const getProgramsByOffering = async (req: Request, res: Response) => {
  try {
    const { offeringId } = req.params;

    if (!offeringId) {
      return res.status(400).json({ message: "Offering ID is required" });
    }

    const offering = await Offering.findOne({ id: offeringId });
    if (!offering) {
      return res.status(404).json({ message: "Offering not found" });
    }

    if (offering.name === "Marathon") {
      return res.status(400).json({ message: "Marathon offerings do not have associated programs" });
    }

    const programs = await Program.find({ offering: offeringId })
      .select("id name description estimatedDuration image offering modules stripeProductId paypalProductId googleClassroomLink")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(programs);
  } catch (error) {
    console.error(`Error fetching programs by offering ID:`, error);
    res.status(500).json({
      message: `Failed to fetch programs by offering ID`,
      error: (error as Error).message,
    });
  }
};

export const addProgram = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      estimatedDuration, 
      image, 
      offering: offeringId, 
      modules, 
      googleClassroomLink 
    } = req.body;

    if (!name || !description || estimatedDuration === undefined || !offeringId) {
      return res.status(400).json({ 
        message: "Missing required fields: name, description, estimatedDuration, offering" 
      });
    }

    if (typeof name !== 'string' || typeof description !== 'string') {
      return res.status(400).json({ message: "Name and description must be strings" });
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (trimmedName.length === 0 || trimmedDescription.length === 0) {
      return res.status(400).json({ message: "Name and description cannot be empty" });
    }

    const duration = parseInt(estimatedDuration);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ message: "Estimated duration must be a positive integer" });
    }

    const offeringExists = await Offering.findOne({ id: offeringId });
    if (!offeringExists) {
      return res.status(404).json({ message: `Offering with ID ${offeringId} not found.` });
    }

    if (offeringExists.name === "Marathon") {
      return res.status(400).json({ message: "Cannot create programs for Marathon offerings" });
    }

    const existingProgram = await Program.findOne({ 
      name: trimmedName, 
      offering: offeringId 
    });
    if (existingProgram) {
      return res.status(409).json({ 
        message: `A program with name "${trimmedName}" already exists in this offering` 
      });
    }

    if (modules && Array.isArray(modules) && modules.length > 0) {
      const existingModules = await Module.find({ id: { $in: modules } });
      if (existingModules.length !== modules.length) {
        return res.status(400).json({ message: "One or more module IDs are invalid" });
      }
    }

    if (googleClassroomLink && typeof googleClassroomLink === 'string') {
      const trimmedLink = googleClassroomLink.trim();
      if (trimmedLink && !isValidUrl(trimmedLink)) {
        return res.status(400).json({ message: "Invalid Google Classroom URL format" });
      }
    }

    const newProgram = new Program({
      name: trimmedName,
      description: trimmedDescription,
      estimatedDuration: duration,
      image: image?.trim() || undefined,
      offering: offeringId,
      modules: modules || [],
      googleClassroomLink: googleClassroomLink?.trim() || undefined,
    });

    const savedProgram = await newProgram.save();

    await Offering.findOneAndUpdate(
      { id: offeringId },
      { $addToSet: { programs: savedProgram.id } }
    );

    const populatedProgram = await Program.findOne({ id: savedProgram.id })
      .select("id name description estimatedDuration image offering modules stripeProductId paypalProductId googleClassroomLink")
      .lean();

    res.status(201).json(populatedProgram);
  } catch (error: any) {
    console.error("Error creating program:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "A program with this information already exists" });
    }

    res.status(500).json({
      message: "Failed to create program",
      error: error.message,
    });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;
    const { 
      name, 
      description, 
      estimatedDuration, 
      image, 
      offering: offeringId, 
      modules, 
      googleClassroomLink 
    } = req.body;

    if (!programId) {
      return res.status(400).json({ message: "Program ID is required" });
    }

    const existingProgram = await Program.findOne({ id: programId });
    if (!existingProgram) {
      return res.status(404).json({ message: "Program not found" });
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Name must be a non-empty string" });
      }
      
      const trimmedName = name.trim();
      
      const duplicateProgram = await Program.findOne({ 
        name: trimmedName, 
        offering: offeringId || existingProgram.offering,
        id: { $ne: programId } 
      });
      if (duplicateProgram) {
        return res.status(409).json({ 
          message: `A program with name "${trimmedName}" already exists in this offering` 
        });
      }
      
      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ message: "Description must be a non-empty string" });
      }
      updateData.description = description.trim();
    }

    if (estimatedDuration !== undefined) {
      const duration = parseInt(estimatedDuration);
      if (isNaN(duration) || duration <= 0) {
        return res.status(400).json({ message: "Estimated duration must be a positive integer" });
      }
      updateData.estimatedDuration = duration;
    }

    if (image !== undefined) {
      updateData.image = image?.trim() || undefined;
    }

    if (googleClassroomLink !== undefined) {
      const trimmedLink = googleClassroomLink?.trim();
      if (trimmedLink && !isValidUrl(trimmedLink)) {
        return res.status(400).json({ message: "Invalid Google Classroom URL format" });
      }
      updateData.googleClassroomLink = trimmedLink || undefined;
    }

    if (offeringId !== undefined) {
      const offeringExists = await Offering.findOne({ id: offeringId });
      if (!offeringExists) {
        return res.status(404).json({ message: `Offering with ID ${offeringId} not found.` });
      }
      if (offeringExists.name === "Marathon") {
        return res.status(400).json({ message: "Cannot associate programs with Marathon offerings" });
      }

      if (offeringId !== existingProgram.offering) {
        await Offering.findOneAndUpdate(
          { id: existingProgram.offering },
          { $pull: { programs: programId } }
        );
        
        await Offering.findOneAndUpdate(
          { id: offeringId },
          { $addToSet: { programs: programId } }
        );
      }
      
      updateData.offering = offeringId;
    }

    if (modules !== undefined) {
      if (!Array.isArray(modules)) {
        return res.status(400).json({ message: "Modules must be an array" });
      }
      
      if (modules.length > 0) {
        const existingModules = await Module.find({ id: { $in: modules } });
        if (existingModules.length !== modules.length) {
          return res.status(400).json({ message: "One or more module IDs are invalid" });
        }
      }
      
      updateData.modules = modules;
    }

    const updatedProgram = await Program.findOneAndUpdate(
      { id: programId },
      updateData,
      { new: true, runValidators: true }
    )
      .select("id name description estimatedDuration image offering modules stripeProductId paypalProductId googleClassroomLink")
      .lean();

    res.status(200).json(updatedProgram);
  } catch (error: any) {
    console.error("Error updating program:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "A program with this information already exists" });
    }

    res.status(500).json({
      message: "Failed to update program",
      error: error.message,
    });
  }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;

    if (!programId) {
      return res.status(400).json({ message: "Program ID is required" });
    }

    const deletedProgram = await Program.findOneAndDelete({ id: programId });

    if (!deletedProgram) {
      return res.status(404).json({ message: "Program not found" });
    }

    if (deletedProgram.offering) {
      await Offering.findOneAndUpdate(
        { id: deletedProgram.offering },
        { $pull: { programs: deletedProgram.id } }
      );
    }

    res.status(200).json({ 
      message: "Program deleted successfully", 
      deletedProgram: {
        id: deletedProgram.id,
        name: deletedProgram.name
      }
    });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({
      message: "Failed to delete program",
      error: (error as Error).message,
    });
  }
};

export const getProgramsByOfferingType = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({ message: "Offering type name is required" });
    }

    if (name === "Marathon") {
      return res.status(400).json({
        message: "Marathon offerings do not have associated programs"
      });
    }

    const offering = await Offering.findOne({ name });
    if (!offering) {
      return res.status(404).json({ message: "Offering not found" });
    }

    const programs = await Program.find({ offering: offering.id })
      .select("id name description estimatedDuration image offering modules stripeProductId paypalProductId googleClassroomLink")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(programs);
  } catch (error) {
    console.error(`Error fetching programs by offering type:`, error);
    res.status(500).json({
      message: `Failed to fetch programs by offering type`,
      error: (error as Error).message,
    });
  }
};

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}