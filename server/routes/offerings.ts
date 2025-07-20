import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  addOffering,
  getAllOfferings,
  getOfferingById,
  updateOffering,
  deleteOffering,
  getOfferingsWithDetails
} from "../handlers/offerings";

export function registerOfferingRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get("/api/offerings/public", getAllOfferings);
  app.get("/api/offerings/public/:offeringId", getOfferingById);
  
  app.get("/api/offerings", isAuthenticated, getAllOfferings);
  app.get("/api/offerings/details", isAuthenticated, getOfferingsWithDetails); // New endpoint for enriched data
  app.get("/api/offerings/:offeringId", isAuthenticated, getOfferingById);
  
  app.post("/api/offerings", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), addOffering);
  app.put("/api/offerings/:offeringId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateOffering);
  app.delete("/api/offerings/:offeringId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteOffering);
}