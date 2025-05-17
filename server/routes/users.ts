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
