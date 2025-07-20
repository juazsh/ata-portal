import type { Express } from "express";
import { UserRole } from "../models/user";
import { User } from "../lib/mongodb";
import { Location } from "../models/location";

export function registerUserRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get("/api/users", isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/profile", isAuthenticated, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("firstName lastName email phone address");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        address: user.address || {}
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.put("/api/users/profile", isAuthenticated, async (req, res) => {
    try {
      const { firstName, lastName, email, phone, address } = req.body;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user.id } 
      });
      
      if (existingUser) {
        return res.status(409).json({ message: "Email is already in use by another account" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          firstName,
          lastName,
          email,
          phone: phone || null,
          address: address || null
        },
        { new: true, runValidators: true }
      ).select("firstName lastName email phone address");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user: {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone || "",
          address: updatedUser.address || {}
        }
      });
    } catch (error) {
      console.error("Failed to update user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.get("/api/users/verify/email", async (req, res) => {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ message: "Email parameter is required" });
      }

      const user = await User.findOne({ email: email.toString() });

      res.json({ exists: !!user });
    } catch (error) {
      console.error("Failed to verify email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Internal user management endpoints
  app.get("/api/internal-users", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), async (req, res) => {
    try {
      const users = await User.find({
        role: { $in: [UserRole.ADMIN, UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.TEACHER] }
      })
      .select("id firstName lastName email role active locationId createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

      res.json(users);
    } catch (error) {
      console.error("Failed to fetch internal users:", error);
      res.status(500).json({ message: "Failed to fetch internal users" });
    }
  });

  
  app.get("/api/internal-users/locations", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), async (req, res) => {
    try {
      const locations = await Location.find({ active: true })
        .select("id name city state active")
        .sort({ name: 1 })
        .lean();

      res.json(locations);
    } catch (error) {
      console.error("Failed to fetch locations for internal users:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post("/api/internal-users", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), async (req, res) => {
    try {
      const { firstName, lastName, email, password, role, locationId, active } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ 
          message: "Missing required fields: firstName, lastName, email, password, and role are required" 
        });
      }

      if (!['admin', 'owner', 'location_manager', 'teacher'].includes(role)) {
        return res.status(400).json({ 
          message: "Role must be one of: admin, owner, location_manager, teacher" 
        });
      }

    
      if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof email !== 'string') {
        return res.status(400).json({ message: "firstName, lastName, and email must be strings" });
      }

      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (trimmedFirstName.length === 0 || trimmedLastName.length === 0 || trimmedEmail.length === 0) {
        return res.status(400).json({ message: "firstName, lastName, and email cannot be empty" });
      }

      
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }

     
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const isStrongPassword = password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);

      if (!isStrongPassword) {
        return res.status(400).json({ 
          message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
        });
      }

      
      const locationRequiredRoles = ['location_manager', 'admin', 'teacher'];
      if (locationRequiredRoles.includes(role)) {
        if (!locationId) {
          return res.status(400).json({ 
            message: `${role.replace('_', ' ')} role requires a location assignment` 
          });
        }

       
        const location = await Location.findOne({ id: locationId, active: true });
        if (!location) {
          return res.status(400).json({ message: "Invalid or inactive location specified" });
        }
      }

      
      const existingUser = await User.findOne({ email: trimmedEmail });
      if (existingUser) {
        return res.status(409).json({ message: "A user with this email already exists" });
      }

     
      const userData: any = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password: password,
        role: role,
        active: active !== undefined ? active : true,
      };

      
      if (locationRequiredRoles.includes(role)) {
        userData.locationId = locationId;
      }

      const newUser = new User(userData);
      const savedUser = await newUser.save();

      
      const userResponse = {
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
        locationId: savedUser.locationId,
        active: savedUser.active,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt
      };

      res.status(201).json(userResponse);
    } catch (error: any) {
      console.error("Failed to create internal user:", error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationErrors 
        });
      }

      if (error.code === 11000) {
        if (error.keyPattern?.email) {
          return res.status(409).json({ message: "A user with this email already exists" });
        }
        return res.status(409).json({ message: "A user with this information already exists" });
      }

      res.status(500).json({ message: "Failed to create internal user" });
    }
  });

  app.put("/api/internal-users/:userId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), async (req, res) => {
    try {
      const { userId } = req.params;
      const { firstName, lastName, email, password, role, locationId, active } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      
      const existingUser = await User.findOne({ id: userId });
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      
      if (!['admin', 'owner', 'location_manager', 'teacher'].includes(existingUser.role)) {
        return res.status(400).json({ message: "Can only update internal users through this endpoint" });
      }

      
      const updateData: any = {};

      if (firstName !== undefined) {
        if (typeof firstName !== 'string' || firstName.trim().length === 0) {
          return res.status(400).json({ message: "firstName must be a non-empty string" });
        }
        updateData.firstName = firstName.trim();
      }

      if (lastName !== undefined) {
        if (typeof lastName !== 'string' || lastName.trim().length === 0) {
          return res.status(400).json({ message: "lastName must be a non-empty string" });
        }
        updateData.lastName = lastName.trim();
      }

      if (email !== undefined) {
        if (typeof email !== 'string' || email.trim().length === 0) {
          return res.status(400).json({ message: "email must be a non-empty string" });
        }

        const trimmedEmail = email.trim().toLowerCase();
        
        
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({ message: "Please provide a valid email address" });
        }

        
        const duplicateUser = await User.findOne({ 
          email: trimmedEmail, 
          id: { $ne: userId } 
        });
        if (duplicateUser) {
          return res.status(409).json({ message: "A user with this email already exists" });
        }

        updateData.email = trimmedEmail;
      }

      if (password !== undefined && password.trim()) {
        
        if (password.length < 8) {
          return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        const isStrongPassword = password.length >= 8 &&
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[^A-Za-z0-9]/.test(password);

        if (!isStrongPassword) {
          return res.status(400).json({ 
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
          });
        }

        updateData.password = password;
      }

      if (role !== undefined) {
        if (!['admin', 'owner', 'location_manager', 'teacher'].includes(role)) {
          return res.status(400).json({ message: "Role must be one of: admin, owner, location_manager, teacher" });
        }
        updateData.role = role;
      }

     
      const finalRole = role || existingUser.role;
      const locationRequiredRoles = ['location_manager', 'admin', 'teacher'];
      
      if (locationRequiredRoles.includes(finalRole)) {
        if (locationId !== undefined) {
          if (locationId) {
           
            const location = await Location.findOne({ id: locationId, active: true });
            if (!location) {
              return res.status(400).json({ message: "Invalid or inactive location specified" });
            }
            updateData.locationId = locationId;
          } else {
            return res.status(400).json({ 
              message: `${finalRole.replace('_', ' ')} role requires a location assignment` 
            });
          }
        } else if (!existingUser.locationId) {
          return res.status(400).json({ 
            message: `${finalRole.replace('_', ' ')} role requires a location assignment` 
          });
        }
      } else if (finalRole === 'owner') {
       
        updateData.locationId = null;
      }

      if (active !== undefined) {
        updateData.active = Boolean(active);
      }

      const updatedUser = await User.findOneAndUpdate(
        { id: userId },
        updateData,
        { new: true, runValidators: true }
      ).select("id firstName lastName email role locationId active createdAt updatedAt");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Failed to update internal user:", error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationErrors 
        });
      }

      if (error.code === 11000) {
        if (error.keyPattern?.email) {
          return res.status(409).json({ message: "A user with this email already exists" });
        }
        return res.status(409).json({ message: "A user with this information already exists" });
      }

      res.status(500).json({ message: "Failed to update internal user" });
    }
  });

  app.delete("/api/internal-users/:userId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const userToDelete = await User.findOne({ id: userId });
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!['admin', 'owner', 'location_manager', 'teacher'].includes(userToDelete.role)) {
        return res.status(400).json({ message: "Can only delete internal users through this endpoint" });
      }

      if (req.user.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const deletedUser = await User.findOneAndDelete({ id: userId });

      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ 
        message: "Internal user deleted successfully", 
        deletedUser: {
          id: deletedUser.id,
          firstName: deletedUser.firstName,
          lastName: deletedUser.lastName,
          email: deletedUser.email
        }
      });
    } catch (error) {
      console.error("Failed to delete internal user:", error);
      res.status(500).json({ message: "Failed to delete internal user" });
    }
  });
}