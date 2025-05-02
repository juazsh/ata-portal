import { Request, Response } from "express";
import DiscountCode, { UsageType } from "../models/discount-code";
import mongoose from "mongoose";

export const isCodeValid = async (code: string): Promise<{ valid: boolean; code?: any; message?: string }> => {
  try {
    const discountCode = await DiscountCode.findOne({
      code: code.toUpperCase(),
      isActive: true
    });

    if (!discountCode) {
      return {
        valid: false,
        message: "Discount code not found or is no longer active"
      };
    }

    const now = new Date();
    if (now > discountCode.expireDate) {
      await DiscountCode.findByIdAndUpdate(discountCode._id, { isActive: false });
      return {
        valid: false,
        message: "Discount code has expired"
      };
    }

    return {
      valid: true,
      code: discountCode
    };
  } catch (error) {
    console.error("Error validating discount code:", error);
    return {
      valid: false,
      message: "Error validating discount code"
    };
  }
};

export const addDiscountCode = async (req: Request, res: Response) => {
  try {
    const { code, usage, percent, expireDate } = req.body;

    if (!code || !usage || !percent || !expireDate) {
      return res.status(400).json({
        message: "Missing required fields: code, usage, percent, expireDate"
      });
    }

    const existingCode = await DiscountCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: "Discount code already exists" });
    }

    const parsedExpireDate = new Date(expireDate);
    if (isNaN(parsedExpireDate.getTime())) {
      return res.status(400).json({ message: "Invalid expiration date format" });
    }

    if (!Object.values(UsageType).includes(usage as UsageType)) {
      return res.status(400).json({
        message: "Invalid usage type. Must be either 'single' or 'multiple'"
      });
    }

    const discountPercent = Number(percent);
    if (isNaN(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return res.status(400).json({
        message: "Percent must be a number between 1 and 100"
      });
    }

    const newDiscountCode = new DiscountCode({
      code: code.toUpperCase(),
      usage,
      percent: discountPercent,
      expireDate: parsedExpireDate,
      createdBy: req.user._id,
    });


    const savedCode = await newDiscountCode.save();

    res.status(201).json(savedCode);
  } catch (error) {
    console.error("Error adding discount code:", error);
    res.status(500).json({
      message: "Failed to add discount code",
      error: (error as Error).message
    });
  }
};


export const getDiscountCodes = async (req: Request, res: Response) => {
  try {

    const { active, createdBy } = req.query;


    const query: any = {};


    if (active !== undefined) {
      query.isActive = active === 'true';
    }


    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy as string)) {
      query.createdBy = createdBy;
    }


    const discountCodes = await DiscountCode.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName email');

    res.status(200).json(discountCodes);
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    res.status(500).json({
      message: "Failed to fetch discount codes",
      error: (error as Error).message
    });
  }
};


export const getDiscountCodeByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;


    const discountCode = await DiscountCode.findOne({ code: code.toUpperCase() })
      .populate('createdBy', 'firstName lastName email');

    if (!discountCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    res.status(200).json(discountCode);
  } catch (error) {
    console.error("Error fetching discount code:", error);
    res.status(500).json({
      message: "Failed to fetch discount code",
      error: (error as Error).message
    });
  }
};


export const updateDiscountCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { percent, expireDate, isActive } = req.body;


    const discountCode = await DiscountCode.findOne({ code: code.toUpperCase() });

    if (!discountCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }


    const updateData: any = {};

    if (percent !== undefined) {

      const discountPercent = Number(percent);
      if (isNaN(discountPercent) || discountPercent < 1 || discountPercent > 100) {
        return res.status(400).json({
          message: "Percent must be a number between 1 and 100"
        });
      }
      updateData.percent = discountPercent;
    }

    if (expireDate !== undefined) {

      const parsedExpireDate = new Date(expireDate);
      if (isNaN(parsedExpireDate.getTime())) {
        return res.status(400).json({ message: "Invalid expiration date format" });
      }
      updateData.expireDate = parsedExpireDate;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive === true;
    }


    const updatedDiscountCode = await DiscountCode.findByIdAndUpdate(
      discountCode._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    res.status(200).json(updatedDiscountCode);
  } catch (error) {
    console.error("Error updating discount code:", error);
    res.status(500).json({
      message: "Failed to update discount code",
      error: (error as Error).message
    });
  }
};


export const deleteDiscountCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;


    const discountCode = await DiscountCode.findOne({ code: code.toUpperCase() });

    if (!discountCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }


    await DiscountCode.findByIdAndDelete(discountCode._id);

    res.status(200).json({
      message: "Discount code deleted successfully",
      code
    });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    res.status(500).json({
      message: "Failed to delete discount code",
      error: (error as Error).message
    });
  }
};


export const verifyDiscountCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;


    const result = await isCodeValid(code);

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        message: result.message
      });
    }


    res.status(200).json({
      valid: true,
      code: result.code.code,
      percent: result.code.percent,
      usage: result.code.usage
    });
  } catch (error) {
    console.error("Error verifying discount code:", error);
    res.status(500).json({
      valid: false,
      message: "Error verifying discount code",
      error: (error as Error).message
    });
  }
};


export const updateExpirationDate = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { expireDate } = req.body;

    if (!expireDate) {
      return res.status(400).json({ message: "Expiration date is required" });
    }


    const parsedExpireDate = new Date(expireDate);
    if (isNaN(parsedExpireDate.getTime())) {
      return res.status(400).json({ message: "Invalid expiration date format" });
    }

    const updatedDiscountCode = await DiscountCode.findOneAndUpdate(
      { code: code.toUpperCase() },
      { expireDate: parsedExpireDate },
      { new: true }
    );

    if (!updatedDiscountCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    res.status(200).json(updatedDiscountCode);
  } catch (error) {
    console.error("Error updating expiration date:", error);
    res.status(500).json({
      message: "Failed to update expiration date",
      error: (error as Error).message
    });
  }
};