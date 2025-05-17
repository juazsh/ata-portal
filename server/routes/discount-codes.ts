import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  addDiscountCode,
  getDiscountCodes,
  getDiscountCodeByCode,
  updateDiscountCode,
  deleteDiscountCode,
  verifyDiscountCode,
  updateExpirationDate
} from "../handlers/discount-codes";

export function registerDiscountCodeRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.post("/api/discount-codes", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), addDiscountCode);
  app.get("/api/discount-codes", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), getDiscountCodes);
  app.get("/api/discount-codes/:code", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), getDiscountCodeByCode);
  app.put("/api/discount-codes/:code", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateDiscountCode);
  app.delete("/api/discount-codes/:code", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteDiscountCode);
  app.patch("/api/discount-codes/:code/expire", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateExpirationDate);
  app.get("/api/discount-codes/:code/verify", verifyDiscountCode);
}
