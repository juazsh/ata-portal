import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { User } from "./lib/mongodb"; // Change this from storage to use MongoDB directly

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication system - add await here
  const { isAuthenticated, hasRole } = await setupAuth(app);

  // API routes - all protected by isAuthenticated middleware

  // Get all users (admin only)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Use Mongoose to get all users
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}