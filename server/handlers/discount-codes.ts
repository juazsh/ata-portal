import { Request, Response } from "express";
import { DiscountCode } from "../models/discount-code";
import { Location } from "../models/location";
import User from "../models/user";
import mongoose from "mongoose";

interface AuthenticatedRequest extends Request {
  user: any;
}

const hasGlobalAccess = (user: any): boolean => {
  return user.role === 'owner';
};

const canAccessLocation = (user: any, locationId: string): boolean => {
  return (user.role === 'owner') 
    ? true 
    : (['location_manager', 'admin', 'teacher'].includes(user.role)) 
      ? user.locationId === locationId 
      : false;
  // if (user.role === 'owner') {
  //   return true;
  // }
  // if (['location_manager', 'admin', 'teacher'].includes(user.role)) {
  //   return user.locationId === locationId;
  // }
  // return false;
};

export const getAllDiscountCodes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let query: any = {};
    if (!hasGlobalAccess(req.user)) {
      if (!req.user.locationId) {
        return res.status(200).json([]);
      }
      query.locationId = req.user.locationId;
    }

    const discountCodes = await DiscountCode.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    // Add location names
    const locationIds = [...new Set(discountCodes.map(code => code.locationId))];
    const locations = await Location.find({ id: { $in: locationIds } })
      .select('id name city state')
      .lean();

    const locationMap = new Map(locations.map(loc => [loc.id, loc]));

    const enrichedCodes = discountCodes.map(code => ({
      ...code,
      locationName: locationMap.get(code.locationId)?.name,
      isExpired: new Date() > new Date(code.expireDate),
      isUsable: code.isActive && new Date() <= new Date(code.expireDate) && 
                (code.usage === 'single' ? code.currentUses === 0 : 
                 !code.maxUses || code.currentUses < code.maxUses)
    }));

    res.status(200).json(enrichedCodes);
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    res.status(500).json({
      message: "Failed to fetch discount codes",
      error: (error as Error).message,
    });
  }
};

export const getDiscountCodeById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { codeId } = req.params;

    if (!codeId) {
      return res.status(400).json({ message: "Discount code ID is required" });
    }

    const discountCode = await DiscountCode.findOne({ id: codeId })
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!discountCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    // Check if user can access this discount code's location
    if (!canAccessLocation(req.user, discountCode.locationId)) {
      return res.status(403).json({ message: "Access denied for this discount code" });
    }

    // Add location info
    const location = await Location.findOne({ id: discountCode.locationId })
      .select('id name city state')
      .lean();

    const enrichedCode = {
      ...discountCode,
      locationName: location?.name,
      isExpired: new Date() > new Date(discountCode.expireDate),
      isUsable: discountCode.isActive && new Date() <= new Date(discountCode.expireDate) && 
                (discountCode.usage === 'single' ? discountCode.currentUses === 0 : 
                 !discountCode.maxUses || discountCode.currentUses < discountCode.maxUses)
    };

    res.status(200).json(enrichedCode);
  } catch (error) {
    console.error("Error fetching discount code by ID:", error);
    res.status(500).json({
      message: "Failed to fetch discount code",
      error: (error as Error).message,
    });
  }
};

export const createDiscountCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      code,
      usage,
      percent,
      expireDate,
      locationId,
      description,
      maxUses,
      isActive
    } = req.body;

    // Validate required fields
    if (!code || !usage || !percent || !expireDate || !locationId) {
      return res.status(400).json({
        message: "Missing required fields: code, usage, percent, expireDate, and locationId are required"
      });
    }

    // Check if user can access this location
    if (!canAccessLocation(req.user, locationId)) {
      return res.status(403).json({ message: "Access denied for this location" });
    }

    // Validate location exists
    const location = await Location.findOne({ id: locationId });
    if (!location) {
      return res.status(400).json({ message: "Location not found" });
    }
    
    // Check if location is active
    if (location.active === false) {
      return res.status(400).json({ message: "Location is inactive" });
    }

    // Validate code format
    const trimmedCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(trimmedCode)) {
      return res.status(400).json({
        message: "Discount code must be 3-20 characters and contain only letters and numbers"
      });
    }

    // Check for duplicate code
    const existingCode = await DiscountCode.findOne({ code: trimmedCode });
    if (existingCode) {
      return res.status(409).json({ message: `Discount code "${trimmedCode}" already exists` });
    }

    // Validate percentage
    const discountPercent = Number(percent);
    if (isNaN(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return res.status(400).json({ message: "Discount percentage must be between 1 and 100" });
    }

    // Validate expiration date
    const expiration = new Date(expireDate);
    if (expiration <= new Date()) {
      return res.status(400).json({ message: "Expiration date must be in the future" });
    }

    // Validate usage type and max uses
    if (!['single', 'multiple'].includes(usage)) {
      return res.status(400).json({ message: "Usage must be either 'single' or 'multiple'" });
    }

    let validatedMaxUses: number | undefined;
    if (usage === 'multiple') {
      if (!maxUses || isNaN(Number(maxUses)) || Number(maxUses) < 1) {
        return res.status(400).json({ message: "Max uses is required for multiple use codes and must be at least 1" });
      }
      validatedMaxUses = Number(maxUses);
    }
    if (!req.user) {
      return res.status(401).json({ message: "User authentication required" });
    }

    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "User ID not found in authentication token" });
    }

    const newDiscountCode = new DiscountCode({
      code: trimmedCode,
      usage,
      percent: discountPercent,
      expireDate: expiration,
      locationId,
      createdBy: userId,
      description: description?.trim() || undefined,
      maxUses: validatedMaxUses,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      currentUses: 0
    });

    const savedCode = await newDiscountCode.save();

    const response = await DiscountCode.findOne({ id: savedCode.id })
      .populate('createdBy', 'firstName lastName email')
      .lean();

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Error creating discount code:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "A discount code with this information already exists" });
    }

    res.status(500).json({
      message: "Failed to create discount code",
      error: error.message,
    });
  }
};

export const updateDiscountCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { codeId } = req.params;
    const {
      code,
      usage,
      percent,
      expireDate,
      locationId,
      description,
      maxUses,
      isActive
    } = req.body;
    if (!codeId) {
      return res.status(400).json({ message: "Discount code ID is required" });
    }
    const existingCode = await DiscountCode.findOne({ id: codeId });
    if (!existingCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }
    if (!canAccessLocation(req.user, existingCode.locationId)) {
      return res.status(403).json({ message: "Access denied for this discount code" });
    }
    const updateData: any = {};
    if (code !== undefined) {
      const trimmedCode = code.trim().toUpperCase();
      
      if (!/^[A-Z0-9]{3,20}$/.test(trimmedCode)) {
        return res.status(400).json({
          message: "Discount code must be 3-20 characters and contain only letters and numbers"
        });
      }
      const duplicateCode = await DiscountCode.findOne({
        code: trimmedCode,
        id: { $ne: codeId }
      });
      if (duplicateCode) {
        return res.status(409).json({ message: `Discount code "${trimmedCode}" already exists` });
      }

      updateData.code = trimmedCode;
    }

    if (usage !== undefined) {
      if (!['single', 'multiple'].includes(usage)) {
        return res.status(400).json({ message: "Usage must be either 'single' or 'multiple'" });
      }
      updateData.usage = usage;
    }

    if (percent !== undefined) {
      const discountPercent = Number(percent);
      if (isNaN(discountPercent) || discountPercent < 1 || discountPercent > 100) {
        return res.status(400).json({ message: "Discount percentage must be between 1 and 100" });
      }
      updateData.percent = discountPercent;
    }

    if (expireDate !== undefined) {
      const expiration = new Date(expireDate);
      if (expiration <= new Date()) {
        return res.status(400).json({ message: "Expiration date must be in the future" });
      }
      updateData.expireDate = expiration;
    }

    if (locationId !== undefined) {
      // Check if user can access the new location
      if (!canAccessLocation(req.user, locationId)) {
        return res.status(403).json({ message: "Access denied for the specified location" });
      }

      // Validate location exists and is active (treating undefined active as true)
      const location = await Location.findOne({ 
        id: locationId,
        $or: [{ active: true }, { active: { $exists: false } }]
      });
      if (!location) {
        return res.status(400).json({ message: "Location not found or is inactive" });
      }
      updateData.locationId = locationId;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || undefined;
    }

    if (maxUses !== undefined) {
      const finalUsage = updateData.usage || existingCode.usage;
      if (finalUsage === 'multiple') {
        if (!maxUses || isNaN(Number(maxUses)) || Number(maxUses) < 1) {
          return res.status(400).json({ message: "Max uses is required for multiple use codes and must be at least 1" });
        }
        updateData.maxUses = Number(maxUses);
      } else {
        updateData.maxUses = undefined;
      }
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updatedCode = await DiscountCode.findOneAndUpdate(
      { id: codeId },
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    res.status(200).json(updatedCode);
  } catch (error: any) {
    console.error("Error updating discount code:", error);

    // Handle MongoDB validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({ message: "A discount code with this information already exists" });
    }

    res.status(500).json({
      message: "Failed to update discount code",
      error: error.message,
    });
  }
};

export const deleteDiscountCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { codeId } = req.params;

    if (!codeId) {
      return res.status(400).json({ message: "Discount code ID is required" });
    }

    // Find the existing discount code
    const existingCode = await DiscountCode.findOne({ id: codeId });
    if (!existingCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    // Check if user can access this discount code's location
    if (!canAccessLocation(req.user, existingCode.locationId)) {
      return res.status(403).json({ message: "Access denied for this discount code" });
    }

    // Check if code has been used
    if (existingCode.currentUses > 0) {
      return res.status(400).json({
        message: `Cannot delete discount code because it has been used ${existingCode.currentUses} time(s). Consider deactivating it instead.`,
      });
    }

    const deletedCode = await DiscountCode.findOneAndDelete({ id: codeId });

    res.status(200).json({
      message: "Discount code deleted successfully",
      deletedCode: {
        id: deletedCode.id,
        code: deletedCode.code
      }
    });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    res.status(500).json({
      message: "Failed to delete discount code",
      error: (error as Error).message,
    });
  }
};

// Additional helper endpoints
export const getDiscountCodesByLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { locationId } = req.params;

    if (!locationId) {
      return res.status(400).json({ message: "Location ID is required" });
    }

    // Check if user can access this location
    if (!canAccessLocation(req.user, locationId)) {
      return res.status(403).json({ message: "Access denied for this location" });
    }

    const discountCodes = await DiscountCode.find({ locationId, isActive: true })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    const enrichedCodes = discountCodes.map(code => ({
      ...code,
      isExpired: new Date() > new Date(code.expireDate),
      isUsable: code.isActive && new Date() <= new Date(code.expireDate) && 
                (code.usage === 'single' ? code.currentUses === 0 : 
                 !code.maxUses || code.currentUses < code.maxUses)
    }));

    res.status(200).json(enrichedCodes);
  } catch (error) {
    console.error("Error fetching discount codes by location:", error);
    res.status(500).json({
      message: "Failed to fetch discount codes by location",
      error: (error as Error).message,
    });
  }
};

// Public endpoint to validate a discount code (for checkout)
export const validateDiscountCode = async (req: Request, res: Response) => {
  try {
    const { code, locationId } = req.body;

    if (!code || !locationId) {
      return res.status(400).json({ message: "Code and location ID are required" });
    }

    const discountCode = await DiscountCode.findOne({
      code: code.trim().toUpperCase(),
      locationId,
      isActive: true
    }).lean();

    if (!discountCode) {
      return res.status(404).json({ message: "Invalid discount code" });
    }

    // Check if expired
    if (new Date() > new Date(discountCode.expireDate)) {
      return res.status(400).json({ message: "Discount code has expired" });
    }

    // Check if still usable
    const isUsable = discountCode.usage === 'single' 
      ? discountCode.currentUses === 0 
      : !discountCode.maxUses || discountCode.currentUses < discountCode.maxUses;

    if (!isUsable) {
      return res.status(400).json({ message: "Discount code has reached its usage limit" });
    }

    res.status(200).json({
      valid: true,
      percent: discountCode.percent,
      description: discountCode.description
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    res.status(500).json({
      message: "Failed to validate discount code",
      error: (error as Error).message,
    });
  }
};

// Endpoint to apply/use a discount code (increment usage)
export const useDiscountCode = async (req: Request, res: Response) => {
  try {
    const { code, locationId } = req.body;

    if (!code || !locationId) {
      return res.status(400).json({ message: "Code and location ID are required" });
    }

    const discountCode = await DiscountCode.findOne({
      code: code.trim().toUpperCase(),
      locationId,
      isActive: true
    });

    if (!discountCode) {
      return res.status(404).json({ message: "Invalid discount code" });
    }

    // Check if expired
    if (new Date() > new Date(discountCode.expireDate)) {
      return res.status(400).json({ message: "Discount code has expired" });
    }

    // Check if still usable
    const isUsable = discountCode.usage === 'single' 
      ? discountCode.currentUses === 0 
      : !discountCode.maxUses || discountCode.currentUses < discountCode.maxUses;

    if (!isUsable) {
      return res.status(400).json({ message: "Discount code has reached its usage limit" });
    }

    // Increment usage
    discountCode.currentUses += 1;
    await discountCode.save();

    res.status(200).json({
      success: true,
      percent: discountCode.percent,
      description: discountCode.description,
      remainingUses: discountCode.usage === 'multiple' 
        ? (discountCode.maxUses || Infinity) - discountCode.currentUses 
        : 0
    });
  } catch (error) {
    console.error("Error using discount code:", error);
    res.status(500).json({
      message: "Failed to use discount code",
      error: (error as Error).message,
    });
  }
};