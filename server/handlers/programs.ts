import { Request, Response } from "express";
import { Program, Offering } from "../models/program";
import mongoose from "mongoose";
import Stripe from 'stripe';
import { createPayPalPlanForProduct, createPayPalProduct } from "./helpers/paypal-client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

export const getProgramsByOffering = async (req: Request, res: Response) => {
  try {
    const { offeringId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(offeringId)) {
      return res.status(400).json({
        message: "Invalid offering ID format"
      });
    }

    const programs = await Program.find({ offering: offeringId })
      .populate("offering", "name description")
      .populate({
        path: "modules",
        select: "name description topics estimatedDuration",
        populate: {
          path: "topics",
          select: "name description estimatedDuration taughtBy",
        },
      })
      .select("name description price googleClassroomLink estimatedDuration offering modules createdAt updatedAt");

    res.status(200).json({
      count: programs.length,
      programs
    });
  } catch (error) {
    console.error(`Error fetching programs by offering ID:`, error);
    res.status(500).json({
      message: `Failed to fetch programs by offering ID`,
      error: (error as Error).message
    });
  }
};
export const getAllPrograms = async (req: Request, res: Response) => {
  try {
    const { offeringType, offering } = req.query;

    let query = Program.find();

    if (offeringType) {
      const offerings = await Offering.find({ offeringType });
      const offeringIds = offerings.map(o => o._id);

      query = Program.find({ offering: { $in: offeringIds } });
    } else if (offering) {
      // Add this condition to support filtering by offering ID
      if (mongoose.Types.ObjectId.isValid(offering as string)) {
        query = Program.find({ offering: offering });
      }
    }

    const programs = await query
      .populate("offering", "name description description2")
      .populate({
        path: "modules",
        select: "name description topics estimatedDuration",
        populate: {
          path: "topics",
          select: "name description estimatedDuration taughtBy",
        },
      })
      .select("name description price googleClassroomLink estimatedDuration offering modules createdAt updatedAt");

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
      .populate("offering", "name offeringType description")
      .populate({
        path: "modules",
        select: "name description topics estimatedDuration",
        populate: {
          path: "topics",
          select: "name description estimatedDuration taughtBy",
        },
      })
      .select("name description price googleClassroomLink estimatedDuration offering modules createdAt updatedAt");

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
    const { name, description, price, googleClassroomLink, estimatedDuration, offering: offeringId, modules } = req.body;

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

    let stripeProductId;
    try {
      const stripeProduct = await stripe.products.create({
        name,
        description,
        metadata: {
          programType: offeringExists.offeringType,
          estimatedDuration: estimatedDuration.toString()
        }
      });

      await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(price * 100),
        currency: 'usd',
      });

      stripeProductId = stripeProduct.id;
    } catch (stripeError) {
      console.error("Stripe product creation error:", stripeError);
    }

    let paypalProductId;
    try {
      paypalProductId = await createPayPalProduct(name, description);

      if (paypalProductId) {
        await createPayPalPlanForProduct(paypalProductId, name, price);
      }
    } catch (paypalError) {
      console.error("PayPal product creation error:", paypalError);
    }

    const newProgram = new Program({
      name,
      description,
      price,
      googleClassroomLink,
      estimatedDuration,
      offering: offeringId,
      modules: modules || [],
      stripeProductId,
      paypalProductId,
    });

    const savedProgram = await newProgram.save();

    await Offering.findByIdAndUpdate(offeringId, { $addToSet: { programs: savedProgram._id } });

    const populatedProgram = await Program.findById(savedProgram._id)
      .populate("offering", "name offeringType")
      .populate("modules", "name estimatedDuration");

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
    const { name, description, price } = updateData;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ message: "Invalid Program ID format" });
    }

    const currentProgram = await Program.findById(programId);
    if (!currentProgram) {
      return res.status(404).json({ message: "Program not found" });
    }

    if (name || description || price) {
      if (currentProgram.stripeProductId) {
        try {
          await stripe.products.update(currentProgram.stripeProductId, {
            name: name || currentProgram.name,
            description: description || currentProgram.description,
          });

          if (price && price !== currentProgram.price) {
            await stripe.prices.create({
              product: currentProgram.stripeProductId,
              unit_amount: Math.round(price * 100),
              currency: 'usd',
            });
          }
        } catch (stripeError) {
          console.error("Stripe product update error:", stripeError);
        }
      }

      if (currentProgram.paypalProductId) {
        try {
          const paypalClient = getPayPalClient();
          const request = new paypal.products.ProductsUpdateRequest(currentProgram.paypalProductId);
          request.requestBody({
            name: name || currentProgram.name,
            description: description || currentProgram.description,
          });

          await paypalClient.execute(request);
        } catch (paypalError) {
          console.error("PayPal product update error:", paypalError);
        }
      }
    }

    const updatedProgram = await Program.findByIdAndUpdate(
      programId,
      updateData,
      { new: true, runValidators: true }
    ).populate("offering", "name offeringType description")
      .populate({
        path: "modules",
        select: "name description topics estimatedDuration",
        populate: {
          path: "topics",
          select: "name description estimatedDuration taughtBy",
        },
      })
      .select("name description price googleClassroomLink estimatedDuration offering modules stripeProductId paypalProductId createdAt updatedAt");

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

    const programToDelete = await Program.findById(programId);
    if (!programToDelete) {
      return res.status(404).json({ message: "Program not found" });
    }

    if (programToDelete.stripeProductId) {
      try {
        await stripe.products.update(programToDelete.stripeProductId, {
          active: false
        });
      } catch (stripeError) {
        console.error("Error deactivating Stripe product:", stripeError);
      }
    }

    if (programToDelete.paypalProductId) {
      try {
        const paypalClient = getPayPalClient();
        const request = new paypal.products.ProductsUpdateRequest(programToDelete.paypalProductId);
        request.requestBody({
          description: `[ARCHIVED] ${programToDelete.description}`
        });
        await paypalClient.execute(request);
      } catch (paypalError) {
        console.error("Error archiving PayPal product:", paypalError);
      }
    }

    const deletedProgram = await Program.findByIdAndDelete(programId);

    if (deletedProgram?.offering) {
      await Offering.findByIdAndUpdate(deletedProgram.offering, { $pull: { programs: deletedProgram._id } });
    }

    res.status(200).json({ message: "Program deleted successfully", programId: deletedProgram?._id });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Failed to delete program", error: (error as Error).message });
  }
};

export const getProgramsByOfferingType = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    if (!['Marathon', 'Sprint'].includes(name)) {
      return res.status(400).json({
        message: "Invalid offering type. Must be either 'Marathon' or 'Sprint'"
      });
    }
    console.log(await Offering.find({}));
    const offering = await Offering.findOne({ name });
    console.log(offering);

    const programs = await Program.find({ offering: offering._id })
      .populate("offering", "name offeringType description")
      .populate({
        path: "modules",
        select: "name description topics estimatedDuration",
        populate: {
          path: "topics",
          select: "name description estimatedDuration taughtBy",
        },
      })
      .select("name description price googleClassroomLink estimatedDuration offering modules createdAt updatedAt");

    res.status(200).json({
      count: programs.length,
      programs
    });
  } catch (error) {
    console.log(`Error fetching programs by offering type:`, error);
    res.status(500).json({
      message: `Failed to fetch programs by offering type`,
      error: (error as Error).message
    });
  }
};