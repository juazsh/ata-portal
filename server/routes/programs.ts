import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  addProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
  getProgramsByOfferingType
} from "../handlers/programs";

export function registerProgramRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get("/api/programs/public", getAllPrograms);
  app.get("/api/programs/public/:programId", getProgramById);
  app.get("/api/programs", isAuthenticated, getAllPrograms);
  app.get("/api/programs/:programId", isAuthenticated, getProgramById);
  app.post("/api/programs", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), addProgram);
  app.put("/api/programs/:programId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateProgram);
  app.delete("/api/programs/:programId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteProgram);
  app.get("/api/programs/public/offering-type/:name", getProgramsByOfferingType);
}
