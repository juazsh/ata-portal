import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationsByState,
  getLocationsByCity,
  getLocationUsers
} from "../handlers/locations";

export function registerLocationRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  // Public routes (no authentication required)
  app.get("/api/locations/public", getAllLocations);
  app.get("/api/locations/public/:locationId", getLocationById);
  app.get("/api/locations/public/state/:state", getLocationsByState);
  app.get("/api/locations/public/city/:city/:state", getLocationsByCity);
  
  // Authenticated routes - all location-specific roles can access
  app.get("/api/locations", isAuthenticated, getAllLocations);
  app.get("/api/locations/:locationId", isAuthenticated, getLocationById);
  app.get("/api/locations/state/:state", isAuthenticated, getLocationsByState);
  app.get("/api/locations/city/:city/:state", isAuthenticated, getLocationsByCity);
  
  // Location users management - accessible to location managers and above
  app.get("/api/locations/:locationId/users", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    getLocationUsers
  );
  
  // Owner-only routes for location management
  app.post("/api/locations", 
    isAuthenticated, 
    hasRole([UserRole.OWNER]), 
    createLocation
  );
  
  app.put("/api/locations/:locationId", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER]), 
    updateLocation
  );
  
  app.delete("/api/locations/:locationId", 
    isAuthenticated, 
    hasRole([UserRole.OWNER]), 
    deleteLocation
  );
}