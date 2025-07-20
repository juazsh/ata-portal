import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDateRange,
  getSchedulesByLocation,
  bookScheduleSlot,
  cancelScheduleSlot
} from "../handlers/schedules";

export function registerScheduleRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get("/api/schedules/public", getAllSchedules);
  app.get("/api/schedules/public/:scheduleId", getScheduleById);
  app.get("/api/schedules/public/location/:locationId", getSchedulesByLocation);
  app.get("/api/schedules/public/date-range", getSchedulesByDateRange);
  
  app.get("/api/schedules", isAuthenticated, getAllSchedules);
  app.get("/api/schedules/:scheduleId", isAuthenticated, getScheduleById);
  app.get("/api/schedules/location/:locationId", isAuthenticated, getSchedulesByLocation);
  app.get("/api/schedules/date-range", isAuthenticated, getSchedulesByDateRange);
  
  app.post("/api/schedules", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    createSchedule
  );
  
  app.put("/api/schedules/:scheduleId", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    updateSchedule
  );
  
  app.delete("/api/schedules/:scheduleId", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN]), 
    deleteSchedule
  );
  
  app.post("/api/schedules/:scheduleId/book", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT]), 
    bookScheduleSlot
  );
  
  app.post("/api/schedules/:scheduleId/cancel", 
    isAuthenticated, 
    hasRole([UserRole.OWNER, UserRole.LOCATION_MANAGER, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT]), 
    cancelScheduleSlot
  );
}