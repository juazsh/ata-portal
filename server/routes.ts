import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { User } from "./lib/mongodb";
import { UserRole } from "./models/user";
import { handleContactUs } from "./handlers/utilities";
import { addPayment, removePayment, getPaymentMethods } from "./handlers/payment";
import { handlePayPalSuccess, handlePayPalCancel } from "./handlers/helpers/process-paypal-payment";
import {
  addStudent,
  getStudentById,
  getStudentsByParent,
  getAllStudents,
  getStudentsByProgram
} from "./handlers/students";
import {
  addProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
  getProgramsByOfferingType,
  getProgramsByOffering,
} from "./handlers/programs";
import {
  addOffering,
  getAllOfferings,
  getOfferingById,
  updateOffering,
  deleteOffering,
} from "./handlers/offerings";
import {
  createEnrollment,
  getEnrollmentById,
  getEnrollments,
  updateEnrollment,
  deleteEnrollment,
  getEnrollmentsByStudent,
  processEnrollmentPayment,
  cancelSubscription
} from "./handlers/enrollments";
import {
  addModule,
  getAllModules,
  getModuleById,
  getModulesByProgram,
  updateModule,
  deleteModule
} from "./handlers/modules";
import {
  addTopic,
  getAllTopics,
  getTopicById,
  getTopicsByModule,
  updateTopic,
  deleteTopic
} from "./handlers/topics";

import {
  completeStudentTopic,
  getStudentProgressHandler
} from "./handlers/students-progress";

import {
  addDiscountCode,
  getDiscountCodes,
  getDiscountCodeByCode,
  updateDiscountCode,
  deleteDiscountCode,
  verifyDiscountCode,
  updateExpirationDate
} from "./handlers/discount-codes";

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

  // >> Student Progress Routes
  app.post(
    "/api/students/:studentId/topics/:topicId/complete",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER, UserRole.TEACHER]),
    completeStudentTopic
  );

  app.get(
    "/api/students/:studentId/progress",
    isAuthenticated,
    getStudentProgressHandler
  );

  // >> Student routes
  app.get(
    "/api/students/all",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    getAllStudents
  );
  app.post("/api/students", isAuthenticated, addStudent);
  app.get("/api/students", isAuthenticated, getStudentsByParent);
  app.get("/api/students/:studentId", isAuthenticated, getStudentById);
  app.get(
    "/api/programs/:programId/students",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    getStudentsByProgram
  );

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
  app.get("/api/programs/public/offering-type/:name", getProgramsByOfferingType);

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
  // >> Module Routes
  app.get("/api/modules", isAuthenticated, getAllModules);
  app.get("/api/modules/:moduleId", isAuthenticated, getModuleById);
  app.get("/api/programs/:programId/modules", isAuthenticated, getModulesByProgram);
  app.post(
    "/api/modules",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    addModule
  );
  app.put(
    "/api/modules/:moduleId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    updateModule
  );
  app.delete(
    "/api/modules/:moduleId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    deleteModule
  );

  // >> Topic Routes
  app.get("/api/topics", isAuthenticated, getAllTopics);
  app.get("/api/topics/:topicId", isAuthenticated, getTopicById);
  app.get("/api/modules/:moduleId/topics", isAuthenticated, getTopicsByModule);
  app.post(
    "/api/topics",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    addTopic
  );
  app.put(
    "/api/topics/:topicId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    updateTopic
  );
  app.delete(
    "/api/topics/:topicId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    deleteTopic
  );

  // >> Enrollment Routes
  app.post(
    "/api/enrollments",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER, UserRole.PARENT]),
    createEnrollment
  );

  app.get(
    "/api/enrollments",
    isAuthenticated,
    getEnrollments
  );

  app.get(
    "/api/enrollments/:enrollmentId",
    isAuthenticated,
    getEnrollmentById
  );

  app.get(
    "/api/students/:studentId/enrollments",
    isAuthenticated,
    getEnrollmentsByStudent
  );

  app.put(
    "/api/enrollments/:enrollmentId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    updateEnrollment
  );

  app.delete(
    "/api/enrollments/:enrollmentId",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    deleteEnrollment
  );

  // >> Process payment for enrollment
  app.post(
    "/api/enrollments/:enrollmentId/process-payment",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER, UserRole.PARENT]),
    processEnrollmentPayment
  );

  // >> Cancel a subscription for Marathon enrollment
  app.post(
    "/api/enrollments/:enrollmentId/cancel-subscription",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    cancelSubscription
  );

  app.get('/enrollments/success', isAuthenticated, handlePayPalSuccess);
  app.get('/enrollments/cancel', isAuthenticated, handlePayPalCancel);

  app.post(
    "/api/discount-codes",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    addDiscountCode
  );

  app.get(
    "/api/discount-codes",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    getDiscountCodes
  );

  app.get(
    "/api/discount-codes/:code",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    getDiscountCodeByCode
  );

  app.put(
    "/api/discount-codes/:code",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    updateDiscountCode
  );

  app.delete(
    "/api/discount-codes/:code",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    deleteDiscountCode
  );

  app.patch(
    "/api/discount-codes/:code/expire",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    updateExpirationDate
  );

  app.get(
    "/api/discount-codes/:code/verify",
    verifyDiscountCode
  );

  // >> Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}