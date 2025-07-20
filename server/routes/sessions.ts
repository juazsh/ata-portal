import type { Express } from "express";
import { createSession, getSessions, getSessionById, updateSession, deleteSession } from '../handlers/sessions';
import { UserRole } from "../models/user";

export function registerSessionRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get("/api/sessions",isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), getSessions);
  app.get("/api/sessions/:id", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), getSessionById);
  app.post("/api/sessions", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), createSession);
  app.put("/api/sessions/:id", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateSession);
  app.delete("/api/sessions/:id", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteSession);
}
