import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  createDemoRegistration,
  getDemoRegistrations,
  getDemoRegistrationById,
  updateDemoRegistration,
  deleteDemoRegistration
} from "../handlers/demo-registrations";

export function registerDemoRegistrationRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.post("/api/demo-registrations", createDemoRegistration);
  app.get("/api/demo-registrations", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), getDemoRegistrations);
  app.get("/api/demo-registrations/:demoRegistrationId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), getDemoRegistrationById);
  app.put("/api/demo-registrations/:demoRegistrationId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateDemoRegistration);
  app.delete("/api/demo-registrations/:demoRegistrationId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteDemoRegistration);
}
