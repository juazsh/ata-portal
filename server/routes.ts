import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { User } from "./lib/mongodb";
import { handleContactUs } from "./handlers/utilities";
import { addPayment, removePayment, getPaymentMethods } from "./handlers/payment";
import { addStudent, getStudentById, getStudentsByParent } from "./handlers/students";

export async function registerRoutes(app: Express): Promise<Server> {

  const { isAuthenticated, hasRole } = await setupAuth(app);

  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // >> Student routes
  app.post("/api/students", isAuthenticated, addStudent);
  app.get("/api/students", isAuthenticated, getStudentsByParent);
  app.get("/api/students/:studentId", isAuthenticated, getStudentById);

  // >> Contact route
  app.post("/api/contact", handleContactUs);

  // >> Payment routes
  app.post("/api/payments", isAuthenticated, addPayment);
  app.get("/api/payments/:userId", isAuthenticated, getPaymentMethods);
  app.delete("/api/payments/:paymentId", isAuthenticated, removePayment);

  // >> Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}