import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  getAllDiscountCodes,
  getDiscountCodeById,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  getDiscountCodesByLocation,
  validateDiscountCode,
  useDiscountCode
} from "../handlers/discount-codes";

export function registerDiscountCodeRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  // Public routes for checkout/validation (no authentication required)
  app.post("/api/discount-codes/validate", validateDiscountCode);
  app.post("/api/discount-codes/use", useDiscountCode);
  
  // Authenticated routes - location-specific roles can manage codes for their location
  app.get("/api/discount-codes", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    getAllDiscountCodes
  );
  
  app.get("/api/discount-codes/:codeId", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    getDiscountCodeById
  );
  
  // Location-specific discount codes
  app.get("/api/locations/:locationId/discount-codes", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    getDiscountCodesByLocation
  );
  
  // Create discount codes - location managers and above
  app.post("/api/discount-codes", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    createDiscountCode
  );
  
  // Update discount codes - location managers and above
  app.put("/api/discount-codes/:codeId", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    updateDiscountCode
  );
  
  // Delete discount codes - location managers and above
  app.delete("/api/discount-codes/:codeId", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    deleteDiscountCode
  );
}