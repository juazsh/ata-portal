import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { User } from "./lib/mongodb";
import { UserRole } from "./models/user";
import { handleContactUs } from "./handlers/utilities";
import { addPayment, removePayment, getPaymentMethods } from "./handlers/payment";
import { addStudent, getStudentById, getStudentsByParent } from "./handlers/students";
import {
  addProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
} from "./handlers/programs";
import {
  addOffering,
  getAllOfferings,
  getOfferingById,
  updateOffering,
  deleteOffering,
} from "./handlers/offerings";

export async function registerRoutes(app: Express): Promise<Server> {
  const { isAuthenticated, hasRole } = await setupAuth(app);

  app.get("/api/users", isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const users = await User.find().select("-password");
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

  // >> Program Routes
  app.get("/api/programs/public", getAllPrograms);
  app.get("/api/programs/public/:programId", getProgramById);
  app.get("/api/programs", isAuthenticated, getAllPrograms);
  app.get("/api/programs/:programId", isAuthenticated, getProgramById);
  app.post(
    "/api/programs",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    addProgram
  );
  app.put(
    "/api/programs/:programId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    updateProgram
  );
  app.delete(
    "/api/programs/:programId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    deleteProgram
  );

  // >> Offering Routes
  app.get("/api/offerings/public", getAllOfferings);
  app.get("/api/offerings/public/:offeringId", getOfferingById);
  app.get("/api/offerings", isAuthenticated, getAllOfferings);
  app.get("/api/offerings/:offeringId", isAuthenticated, getOfferingById);
  app.post(
    "/api/offerings",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    addOffering
  );
  app.put(
    "/api/offerings/:offeringId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    updateOffering
  );
  app.delete(
    "/api/offerings/:offeringId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    deleteOffering
  );

  // >> Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}