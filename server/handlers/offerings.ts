import { Offering } from "../models/offering";
import { Program } from "../models/program";
import { Plan } from "../models/plan";
import { Request, Response } from "express";
import mongoose from "mongoose";

export const getAllOfferings = async (req: Request, res: Response) => {
  try {
    const offerings = await Offering.find()
      .select("id name description description2 plans programs")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(offerings);
  } catch (error) {
    console.error("Error fetching offerings:", error);
    res.status(500).json({ message: "Failed to fetch offerings", error: (error as Error).message });
  }
};

export const getOfferingById = async (req: Request, res: Response) => {
  try {
    const { offeringId } = req.params;

    if (!offeringId) {
      return res.status(400).json({ message: "Offering ID is required" });
    }

    const offering = await Offering.findOne({ id: offeringId })
      .select("id name description description2 plans programs")
      .lean();

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
    const { name, description, description2, plans, programs } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required" });
    }

    if (typeof name !== 'string' || typeof description !== 'string') {
      return res.status(400).json({ message: "Name and description must be strings" });
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedDescription2 = description2?.trim();

    if (trimmedName.length === 0 || trimmedDescription.length === 0) {
      return res.status(400).json({ message: "Name and description cannot be empty" });
    }

    const existingOffering = await Offering.findOne({ name: trimmedName });
    if (existingOffering) {
      return res.status(409).json({ message: `Offering with name "${trimmedName}" already exists.` });
    }

    let validatedPlans: string[] | undefined;
    let validatedPrograms: string[] | undefined;

    if (trimmedName === "Marathon") {
      if (plans && Array.isArray(plans)) {
        if (plans.length > 0) {
          const existingPlans = await Plan.find({ id: { $in: plans } });
          if (existingPlans.length !== plans.length) {
            return res.status(400).json({ message: "One or more plan IDs are invalid" });
          }
        }
        validatedPlans = plans;
      } else {
        validatedPlans = [];
      }
      validatedPrograms = undefined;
    } else {
      if (programs && Array.isArray(programs)) {
        if (programs.length > 0) {
          const existingPrograms = await Program.find({ id: { $in: programs } });
          if (existingPrograms.length !== programs.length) {
            return res.status(400).json({ message: "One or more program IDs are invalid" });
          }
        }
        validatedPrograms = programs;
      } else {
        validatedPrograms = [];
      }
      validatedPlans = undefined;
    }

    const newOffering = new Offering({
      name: trimmedName,
      description: trimmedDescription,
      description2: trimmedDescription2,
      plans: validatedPlans,
      programs: validatedPrograms,
    });

    const savedOffering = await newOffering.save();
    res.status(201).json(savedOffering);
  } catch (error: any) {
    console.error("Error adding offering:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "An offering with this information already exists" });
    }

    res.status(500).json({ message: "Failed to add offering", error: error.message });
  }
};

export const updateOffering = async (req: Request, res: Response) => {
  try {
    const { offeringId } = req.params;
    const { name, description, description2, plans, programs } = req.body;

    if (!offeringId) {
      return res.status(400).json({ message: "Offering ID is required" });
    }

    const existingOffering = await Offering.findOne({ id: offeringId });
    if (!existingOffering) {
      return res.status(404).json({ message: "Offering not found" });
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Name must be a non-empty string" });
      }
      
      const trimmedName = name.trim();
      
      const duplicateOffering = await Offering.findOne({ 
        name: trimmedName, 
        id: { $ne: offeringId } 
      });
      if (duplicateOffering) {
        return res.status(409).json({ message: `An offering with name "${trimmedName}" already exists` });
      }
      
      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ message: "Description must be a non-empty string" });
      }
      updateData.description = description.trim();
    }

    if (description2 !== undefined) {
      updateData.description2 = description2?.trim() || undefined;
    }

    const finalName = updateData.name || existingOffering.name;

    if (finalName === "Marathon") {
      if (plans !== undefined) {
        if (!Array.isArray(plans)) {
          return res.status(400).json({ message: "Plans must be an array" });
        }
        
        if (plans.length > 0) {
          const existingPlans = await Plan.find({ id: { $in: plans } });
          if (existingPlans.length !== plans.length) {
            return res.status(400).json({ message: "One or more plan IDs are invalid" });
          }
        }
        updateData.plans = plans;
      }
      if (existingOffering.name !== "Marathon") {
        updateData.programs = undefined;
      }
    } else {
      if (programs !== undefined) {
        if (!Array.isArray(programs)) {
          return res.status(400).json({ message: "Programs must be an array" });
        }
        
        if (programs.length > 0) {
          const existingPrograms = await Program.find({ id: { $in: programs } });
          if (existingPrograms.length !== programs.length) {
            return res.status(400).json({ message: "One or more program IDs are invalid" });
          }
        }
        updateData.programs = programs;
      }
      if (existingOffering.name === "Marathon") {
        updateData.plans = undefined;
      }
    }

    const updatedOffering = await Offering.findOneAndUpdate(
      { id: offeringId },
      updateData,
      { new: true, runValidators: true }
    ).select("id name description description2 plans programs");

    res.status(200).json(updatedOffering);
  } catch (error: any) {
    console.error("Error updating offering:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "An offering with this information already exists" });
    }

    res.status(500).json({ message: "Failed to update offering", error: error.message });
  }
};

export const deleteOffering = async (req: Request, res: Response) => {
  try {
    const { offeringId } = req.params;

    if (!offeringId) {
      return res.status(400).json({ message: "Offering ID is required" });
    }

    const associatedPrograms = await Program.countDocuments({ offering: offeringId });
    if (associatedPrograms > 0) {
      return res.status(400).json({
        message: `Cannot delete offering because it has ${associatedPrograms} associated program(s). Please reassign or delete them first.`,
      });
    }

    const deletedOffering = await Offering.findOneAndDelete({ id: offeringId });

    if (!deletedOffering) {
      return res.status(404).json({ message: "Offering not found" });
    }

    res.status(200).json({ 
      message: "Offering deleted successfully", 
      deletedOffering: {
        id: deletedOffering.id,
        name: deletedOffering.name
      }
    });
  } catch (error) {
    console.error("Error deleting offering:", error);
    res.status(500).json({ message: "Failed to delete offering", error: (error as Error).message });
  }
};

export const getOfferingsWithDetails = async (req: Request, res: Response) => {
  try {
    const offerings = await Offering.find()
      .select("id name description description2 plans programs")
      .sort({ createdAt: -1 })
      .lean();

    const enrichedOfferings = await Promise.all(
      offerings.map(async (offering) => {
        if (offering.plans && offering.plans.length > 0) {
          const planDetails = await Plan.find({ id: { $in: offering.plans } })
            .select("id name defaultPrice")
            .lean();
          return { ...offering, planDetails };
        }
        
        if (offering.programs && offering.programs.length > 0) {
          const programDetails = await Program.find({ id: { $in: offering.programs } })
            .select("id name")
            .lean();
          return { ...offering, programDetails };
        }
        
        return offering;
      })
    );

    res.status(200).json(enrichedOfferings);
  } catch (error) {
    console.error("Error fetching offerings with details:", error);
    res.status(500).json({ message: "Failed to fetch offerings with details", error: (error as Error).message });
  }
};