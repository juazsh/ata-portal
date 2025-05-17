import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  addClassSession,
  getAllClassSessions,
  getClassSessionById,
  updateClassSession,
  deleteClassSession
} from "../handlers/class-sessions";

export function registerClassSessionRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get("/api/class-sessions", getAllClassSessions);
  app.get("/api/class-sessions/:sessionId", getClassSessionById);
  app.post("/api/class-sessions", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), addClassSession);
  app.put("/api/class-sessions/:sessionId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateClassSession);
  app.delete("/api/class-sessions/:sessionId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteClassSession);
}
