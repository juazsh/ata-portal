import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  createRegistration,
  getRegistrationById,
  getRegistrations,
  verifyRegistration,
  deleteRegistration
} from "../handlers/registrations";

export function registerRegistrationRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.post("/api/registrations", createRegistration);
  app.get("/api/registrations", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), getRegistrations);
  app.get("/api/registrations/:registrationId", getRegistrationById);
  app.patch("/api/registrations/:registrationId/verify", verifyRegistration);
  app.delete("/api/registrations/:registrationId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteRegistration);
}
