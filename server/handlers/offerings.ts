import { Request, Response } from "express";
import { Offering, Program } from "../models/program";
import mongoose from "mongoose";

export const getAllOfferings = async (req: Request, res: Response) => {
  try {
    const offerings = await Offering.find()
      .populate("programs", "name description");

    res.status(200).json(offerings);
  } catch (error) {
    console.error("Error fetching offerings:", error);
    res.status(500).json({ message: "Failed to fetch offerings", error: (error as Error).message });
  }
};

export const getOfferingById = async (req: Request, res: Response) => {
  try {
    const { offeringId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(offeringId)) {
      return res.status(400).json({ message: "Invalid Offering ID format" });
    }

    const offering = await Offering.findById(offeringId)
      .populate("programs", "name description estimatedDuration");

    if (!offering) {
      return res.status(404).json({ message: "Offering not found" });
    }

    res.status(200).json(offering);
  } catch (error) {
    console.error("Error fetching offering by ID:", error);
    res.status(500).json({ message: "Failed to fetch offering", error: (error as Error).message });
  }
};

export const addOffering = async (req: Request, res: Response) => {
  try {
    const { name, description, estimatedDuration } = req.body;

    if (!name || !description || estimatedDuration === undefined) {
      return res.status(400).json({ message: "Missing required fields: name, description, estimatedDuration" });
    }

    const existingOffering = await Offering.findOne({ name });
    if (existingOffering) {
      return res.status(409).json({ message: `Offering with name "${name}" already exists.` });
    }

    const newOffering = new Offering({
      name,
      description,
      estimatedDuration,
      programs: [],
    });

    const savedOffering = await newOffering.save();
    res.status(201).json(savedOffering);

  } catch (error: any) {
    console.error("Error adding offering:", error);
    if (error.code === 11000 || error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: "Validation failed or duplicate name", error: error.message, errors: error.errors });
    }
    res.status(500).json({ message: "Failed to add offering", error: error.message });
  }
};

export const updateOffering = async (req: Request, res: Response) => {
  try {
    const { offeringId } = req.params;
    const { programs, ...updateData } = req.body;


    if (!mongoose.Types.ObjectId.isValid(offeringId)) {
      return res.status(400).json({ message: "Invalid Offering ID format" });
    }

    const updatedOffering = await Offering.findByIdAndUpdate(
      offeringId,
      updateData,
      { new: true, runValidators: true }
    ).populate("programs", "name description");

    if (!updatedOffering) {
      return res.status(404).json({ message: "Offering not found" });
    }

    res.status(200).json(updatedOffering);

  } catch (error: any) {
    console.error("Error updating offering:", error);
    if (error.code === 11000 || error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: "Validation failed or duplicate name", error: error.message, errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update offering", error: error.message });
  }
};


export const deleteOffering = async (req: Request, res: Response) => {
  try {
    const { offeringId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(offeringId)) {
      return res.status(400).json({ message: "Invalid Offering ID format" });
    }


    const associatedPrograms = await Program.countDocuments({ offering: offeringId });
    if (associatedPrograms > 0) {
      return res.status(400).json({
        message: `Cannot delete offering because it has ${associatedPrograms} associated program(s). Please reassign or delete them first.`,
        programCount: associatedPrograms
      });
    }

    const deletedOffering = await Offering.findByIdAndDelete(offeringId);

    if (!deletedOffering) {
      return res.status(404).json({ message: "Offering not found" });
    }

    res.status(200).json({ message: "Offering deleted successfully", offeringId: deletedOffering._id });

  } catch (error) {
    console.error("Error deleting offering:", error);
    res.status(500).json({ message: "Failed to delete offering", error: (error as Error).message });
  }
};