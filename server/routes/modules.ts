import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  addModule,
  getAllModules,
  getModuleById,
  getModulesByProgram,
  updateModule,
  deleteModule
} from "../handlers/modules";

export function registerModuleRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get("/api/modules", isAuthenticated, getAllModules);
  app.get("/api/modules/:moduleId", isAuthenticated, getModuleById);
  app.get("/api/programs/:programId/modules", isAuthenticated, getModulesByProgram);
  app.post("/api/modules", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), addModule);
  app.put("/api/modules/:moduleId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateModule);
  app.delete("/api/modules/:moduleId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteModule);
}
