import type { Express } from "express";
import { UserRole } from "../models/user";
import { User } from "../lib/mongodb";

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
}