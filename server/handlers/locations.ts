import { Request, Response } from "express";
import { Location } from "../models/location";
import  User  from "../models/user";
import { Offering } from "../models/offering";
import { Plan } from "../models/plan";
import { Program } from "../models/program";
import mongoose from "mongoose";

interface AuthenticatedRequest extends Request {
  user: any; 
}

const hasGlobalAccess = (user: any): boolean => {
  return user.role === 'owner';
};

const canAccessLocation = (user: any, locationId: string): boolean => {
  return (!user) 
        ? false 
        : (user.role === 'owner') 
          ? true 
          : (['location_manager', 'admin', 'teacher'].includes(user.role))
            ? user.locationId === locationId
            : (['parent', 'student'].includes(user.role))
              ? !user.locationId || user.locationId === locationId
              : false; 

  // if (!user) return false;
  // if (user.role === 'owner') {
  //   return true;
  // }
  // if (['location_manager', 'admin', 'teacher'].includes(user.role)) {
  //   return user.locationId === locationId;
  // }
  // if (['parent', 'student'].includes(user.role)) {
  //   return !user.locationId || user.locationId === locationId;
  // }
  // return false;
};
const validateUser = (req: AuthenticatedRequest, res: Response): boolean => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }
  if (!req.user.role) {
    res.status(401).json({ message: "User role not found" });
    return false;
  }
  return true;
};

export const getAllLocations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!validateUser(req, res)) return;
    let query = Location.find({});
    if (!hasGlobalAccess(req.user)) {
      if (!req.user.locationId) {
        return res.status(200).json([]);
      }
      query = Location.find({ id: req.user.locationId, active: true });
    }

    const locations = await query
      .select("id name address1 address2 city state zip country email phoneNumber offerings active")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({
      message: "Failed to fetch locations",
      error: (error as Error).message,
    });
  }
};

export const getLocationById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { locationId } = req.params;
    if (!locationId) {
      return res.status(400).json({ message: "Location ID is required" });
    }
    if (!canAccessLocation(req.user, locationId)) {
      return res.status(403).json({ message: "Access denied for this location" });
    }
    const location = await Location.findOne({ id: locationId })
      .select("id name address1 address2 city state zip country email phoneNumber offerings active")
      .lean();
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.status(200).json(location);
  } catch (error) {
    console.error("Error fetching location by ID:", error);
    res.status(500).json({
      message: "Failed to fetch location",
      error: (error as Error).message,
    });
  }
};

export const createLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      address1,
      address2,
      city,
      state,
      zip,
      country,
      email,
      phoneNumber,
      offerings,
      active
    } = req.body;

    // Only owners can create locations
    if (!hasGlobalAccess(req.user)) {
      return res.status(403).json({ message: "Only owners can create locations" });
    }

    // Validate required fields
    if (!name || !address1 || !city || !state || !zip || !country || !email || !phoneNumber) {
      return res.status(400).json({
        message: "Missing required fields: name, address1, city, state, zip, country, email, and phoneNumber are required"
      });
    }

    // Validate data types
    if (typeof name !== 'string' || typeof address1 !== 'string' || typeof city !== 'string') {
      return res.status(400).json({ message: "Name, address1, and city must be strings" });
    }

    // Trim inputs
    const trimmedName = name.trim();
    const trimmedAddress1 = address1.trim();
    const trimmedCity = city.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhoneNumber = phoneNumber.trim();

    if (trimmedName.length === 0 || trimmedAddress1.length === 0 || trimmedCity.length === 0) {
      return res.status(400).json({ message: "Name, address1, and city cannot be empty" });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Validate ZIP code format
    if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
      return res.status(400).json({ message: "Please provide a valid ZIP code" });
    }

    // Check for duplicate location name
    const existingLocation = await Location.findOne({ name: trimmedName });
    if (existingLocation) {
      return res.status(409).json({ message: `A location with name "${trimmedName}" already exists` });
    }

    // Validate and process offerings if provided
    let validatedOfferings: any[] = [];
    if (offerings && Array.isArray(offerings) && offerings.length > 0) {
      for (const offering of offerings) {
        if (!offering.id || !offering.name) {
          return res.status(400).json({ message: "Each offering must have id and name" });
        }

        // Verify offering exists
        const existingOffering = await Offering.findOne({ id: offering.id });
        if (!existingOffering) {
          return res.status(400).json({ message: `Offering with ID ${offering.id} not found` });
        }

        const processedOffering: any = {
          id: offering.id,
          name: offering.name
        };

        // Process plans for Marathon offerings
        if (offering.plans && Array.isArray(offering.plans)) {
          if (existingOffering.name !== "Marathon") {
            return res.status(400).json({ message: `Plans can only be associated with Marathon offerings` });
          }

          for (const plan of offering.plans) {
            if (!plan.id || !plan.name || plan.price === undefined || plan.tax === undefined) {
              return res.status(400).json({ message: "Each plan must have id, name, price, and tax" });
            }

            // Verify plan exists
            const existingPlan = await Plan.findOne({ id: plan.id });
            if (!existingPlan) {
              return res.status(400).json({ message: `Plan with ID ${plan.id} not found` });
            }

            // Validate pricing
            const price = parseFloat(plan.price);
            const tax = parseFloat(plan.tax);
            if (isNaN(price) || price < 0) {
              return res.status(400).json({ message: "Plan price must be a valid number >= 0" });
            }
            if (isNaN(tax) || tax < 0 || tax > 100) {
              return res.status(400).json({ message: "Plan tax must be a valid percentage between 0 and 100" });
            }
          }

          processedOffering.plans = offering.plans;
        }

        // Process programs for non-Marathon offerings
        if (offering.programs && Array.isArray(offering.programs)) {
          if (existingOffering.name === "Marathon") {
            return res.status(400).json({ message: `Programs cannot be associated with Marathon offerings` });
          }

          for (const program of offering.programs) {
            if (!program.id || !program.name || program.price === undefined || program.tax === undefined) {
              return res.status(400).json({ message: "Each program must have id, name, price, and tax" });
            }

            // Verify program exists
            const existingProgram = await Program.findOne({ id: program.id });
            if (!existingProgram) {
              return res.status(400).json({ message: `Program with ID ${program.id} not found` });
            }

            // Validate pricing
            const price = parseFloat(program.price);
            const tax = parseFloat(program.tax);
            if (isNaN(price) || price < 0) {
              return res.status(400).json({ message: "Program price must be a valid number >= 0" });
            }
            if (isNaN(tax) || tax < 0 || tax > 100) {
              return res.status(400).json({ message: "Program tax must be a valid percentage between 0 and 100" });
            }
          }

          processedOffering.programs = offering.programs;
        }

        validatedOfferings.push(processedOffering);
      }
    }

    const newLocation = new Location({
      name: trimmedName,
      address1: trimmedAddress1,
      address2: address2?.trim(),
      city: trimmedCity,
      state: state.trim(),
      zip: zip.trim(),
      country: country.trim(),
      email: trimmedEmail,
      phoneNumber: trimmedPhoneNumber,
      offerings: validatedOfferings,
      active: active !== undefined ? Boolean(active) : true
    });

    const savedLocation = await newLocation.save();

    const response = await Location.findOne({ id: savedLocation.id })
      .select("id name address1 address2 city state zip country email phoneNumber offerings active")
      .lean();

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Error creating location:", error);

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
      return res.status(409).json({ message: "A location with this information already exists" });
    }

    res.status(500).json({
      message: "Failed to create location",
      error: error.message,
    });
  }
};

export const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { locationId } = req.params;
    const {
      name,
      address1,
      address2,
      city,
      state,
      zip,
      country,
      email,
      phoneNumber,
      offerings,
      active
    } = req.body;

    if (!locationId) {
      return res.status(400).json({ message: "Location ID is required" });
    }

    // Check if user can access this location
    if (!canAccessLocation(req.user, locationId)) {
      return res.status(403).json({ message: "Access denied for this location" });
    }

    // Find the existing location
    const existingLocation = await Location.findOne({ id: locationId });
    if (!existingLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    // Only owners can change active status
    if (active !== undefined && !hasGlobalAccess(req.user)) {
      return res.status(403).json({ message: "Only owners can change location active status" });
    }

    // Build update object
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Name must be a non-empty string" });
      }

      const trimmedName = name.trim();

      // Check for duplicate names (excluding current location)
      const duplicateLocation = await Location.findOne({
        name: trimmedName,
        id: { $ne: locationId }
      });
      if (duplicateLocation) {
        return res.status(409).json({ message: `A location with name "${trimmedName}" already exists` });
      }

      updateData.name = trimmedName;
    }

    if (address1 !== undefined) {
      if (typeof address1 !== 'string' || address1.trim().length === 0) {
        return res.status(400).json({ message: "Address1 must be a non-empty string" });
      }
      updateData.address1 = address1.trim();
    }

    if (address2 !== undefined) {
      updateData.address2 = address2?.trim() || undefined;
    }

    if (city !== undefined) {
      if (typeof city !== 'string' || city.trim().length === 0) {
        return res.status(400).json({ message: "City must be a non-empty string" });
      }
      updateData.city = city.trim();
    }

    if (state !== undefined) {
      updateData.state = state.trim();
    }

    if (zip !== undefined) {
      if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
        return res.status(400).json({ message: "Please provide a valid ZIP code" });
      }
      updateData.zip = zip.trim();
    }

    if (country !== undefined) {
      updateData.country = country.trim();
    }

    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      updateData.email = trimmedEmail;
    }

    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber.trim();
    }

    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    // Handle offerings update
    if (offerings !== undefined) {
      if (!Array.isArray(offerings)) {
        return res.status(400).json({ message: "Offerings must be an array" });
      }

      let validatedOfferings: any[] = [];
      for (const offering of offerings) {
        if (!offering.id || !offering.name) {
          return res.status(400).json({ message: "Each offering must have id and name" });
        }

        // Verify offering exists
        const existingOffering = await Offering.findOne({ id: offering.id });
        if (!existingOffering) {
          return res.status(400).json({ message: `Offering with ID ${offering.id} not found` });
        }

        const processedOffering: any = {
          id: offering.id,
          name: offering.name
        };

        // Process plans for Marathon offerings
        if (offering.plans && Array.isArray(offering.plans)) {
          if (existingOffering.name !== "Marathon") {
            return res.status(400).json({ message: `Plans can only be associated with Marathon offerings` });
          }

          for (const plan of offering.plans) {
            if (!plan.id || !plan.name || plan.price === undefined || plan.tax === undefined) {
              return res.status(400).json({ message: "Each plan must have id, name, price, and tax" });
            }

            // Verify plan exists
            const existingPlan = await Plan.findOne({ id: plan.id });
            if (!existingPlan) {
              return res.status(400).json({ message: `Plan with ID ${plan.id} not found` });
            }

            // Validate pricing
            const price = parseFloat(plan.price);
            const tax = parseFloat(plan.tax);
            if (isNaN(price) || price < 0) {
              return res.status(400).json({ message: "Plan price must be a valid number >= 0" });
            }
            if (isNaN(tax) || tax < 0 || tax > 100) {
              return res.status(400).json({ message: "Plan tax must be a valid percentage between 0 and 100" });
            }
          }

          processedOffering.plans = offering.plans;
        }

        // Process programs for non-Marathon offerings
        if (offering.programs && Array.isArray(offering.programs)) {
          if (existingOffering.name === "Marathon") {
            return res.status(400).json({ message: `Programs cannot be associated with Marathon offerings` });
          }

          for (const program of offering.programs) {
            if (!program.id || !program.name || program.price === undefined || program.tax === undefined) {
              return res.status(400).json({ message: "Each program must have id, name, price, and tax" });
            }

            // Verify program exists
            const existingProgram = await Program.findOne({ id: program.id });
            if (!existingProgram) {
              return res.status(400).json({ message: `Program with ID ${program.id} not found` });
            }

            // Validate pricing
            const price = parseFloat(program.price);
            const tax = parseFloat(program.tax);
            if (isNaN(price) || price < 0) {
              return res.status(400).json({ message: "Program price must be a valid number >= 0" });
            }
            if (isNaN(tax) || tax < 0 || tax > 100) {
              return res.status(400).json({ message: "Program tax must be a valid percentage between 0 and 100" });
            }
          }

          processedOffering.programs = offering.programs;
        }

        validatedOfferings.push(processedOffering);
      }

      updateData.offerings = validatedOfferings;
    }

    const updatedLocation = await Location.findOneAndUpdate(
      { id: locationId },
      updateData,
      { new: true, runValidators: true }
    ).select("id name address1 address2 city state zip country email phoneNumber offerings active");

    res.status(200).json(updatedLocation);
  } catch (error: any) {
    console.error("Error updating location:", error);

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
      return res.status(409).json({ message: "A location with this information already exists" });
    }

    res.status(500).json({
      message: "Failed to update location",
      error: error.message,
    });
  }
};

export const deleteLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { locationId } = req.params;

    if (!locationId) {
      return res.status(400).json({ message: "Location ID is required" });
    }

    // Only owners can delete locations
    if (!hasGlobalAccess(req.user)) {
      return res.status(403).json({ message: "Only owners can delete locations" });
    }

    // Check if location has assigned users
    const assignedUsers = await User.countDocuments({ locationId: locationId });
    if (assignedUsers > 0) {
      return res.status(400).json({
        message: `Cannot delete location because it has ${assignedUsers} assigned user(s). Please reassign or remove them first.`,
      });
    }

    const deletedLocation = await Location.findOneAndDelete({ id: locationId });

    if (!deletedLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.status(200).json({
      message: "Location deleted successfully",
      deletedLocation: {
        id: deletedLocation.id,
        name: deletedLocation.name
      }
    });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({
      message: "Failed to delete location",
      error: (error as Error).message,
    });
  }
};

// Additional helper endpoints
export const getLocationsByState = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { state } = req.params;

    if (!state) {
      return res.status(400).json({ message: "State parameter is required" });
    }

    let query = Location.find({ state, active: true });
    
    // Filter by user access
    if (!hasGlobalAccess(req.user)) {
      if (!req.user.locationId) {
        return res.status(200).json([]);
      }
      query = Location.find({ state, id: req.user.locationId, active: true });
    }

    const locations = await query
      .select("id name address1 address2 city state zip country email phoneNumber")
      .sort({ city: 1, name: 1 })
      .lean();

    res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations by state:", error);
    res.status(500).json({
      message: "Failed to fetch locations by state",
      error: (error as Error).message,
    });
  }
};

export const getLocationsByCity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { city, state } = req.params;

    if (!city || !state) {
      return res.status(400).json({ message: "City and state parameters are required" });
    }

    let query = Location.find({ 
      city: new RegExp(city, 'i'), 
      state,
      active: true
    });
    
    // Filter by user access
    if (!hasGlobalAccess(req.user)) {
      if (!req.user.locationId) {
        return res.status(200).json([]);
      }
      query = Location.find({ 
        city: new RegExp(city, 'i'), 
        state,
        id: req.user.locationId,
        active: true
      });
    }

    const locations = await query
      .select("id name address1 address2 city state zip country email phoneNumber")
      .sort({ name: 1 })
      .lean();

    res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations by city:", error);
    res.status(500).json({
      message: "Failed to fetch locations by city",
      error: (error as Error).message,
    });
  }
};

// New endpoint to get assigned users for a location (owners only)
export const getLocationUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { locationId } = req.params;

    if (!locationId) {
      return res.status(400).json({ message: "Location ID is required" });
    }

    // Check if user can access this location
    if (!canAccessLocation(req.user, locationId)) {
      return res.status(403).json({ message: "Access denied for this location" });
    }

    const users = await User.find({ locationId })
      .select("id firstName lastName email role active")
      .sort({ role: 1, lastName: 1, firstName: 1 })
      .lean();

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching location users:", error);
    res.status(500).json({
      message: "Failed to fetch location users",
      error: (error as Error).message,
    });
  }
};