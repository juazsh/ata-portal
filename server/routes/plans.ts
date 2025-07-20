import type { Express } from "express";
import { getPlans, getPlanById, createPlan, updatePlan, removePlan } from "../handlers/plans"
import { UserRole } from "../models/user";

export function registerPlanRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get("/api/plans", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), getPlans);
  app.get("/api/plans/:id", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), getPlanById);
  app.post("/api/plans", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), createPlan);
  app.put("/api/plans/:id", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updatePlan);
  app.delete("/api/plans/:id", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), removePlan);
}