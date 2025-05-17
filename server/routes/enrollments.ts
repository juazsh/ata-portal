import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  createEnrollment,
  getEnrollmentById,
  getEnrollments,
  updateEnrollment,
  deleteEnrollment,
  getEnrollmentsByStudent,
  processEnrollmentPayment,
  cancelSubscription
} from "../handlers/enrollments";

export function registerEnrollmentRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.post("/api/enrollments", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER, UserRole.PARENT]), createEnrollment);
  app.get("/api/enrollments", isAuthenticated, getEnrollments);
  app.get("/api/enrollments/:enrollmentId", isAuthenticated, getEnrollmentById);
  app.get("/api/students/:studentId/enrollments", isAuthenticated, getEnrollmentsByStudent);
  app.put("/api/enrollments/:enrollmentId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateEnrollment);
  app.delete("/api/enrollments/:enrollmentId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteEnrollment);
  app.post("/api/enrollments/:enrollmentId/process-payment", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER, UserRole.PARENT]), processEnrollmentPayment);
  app.post("/api/enrollments/:enrollmentId/cancel-subscription", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), cancelSubscription);
}
