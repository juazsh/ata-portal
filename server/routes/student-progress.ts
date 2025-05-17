import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  completeStudentTopic,
  getStudentProgressHandler
} from "../handlers/students-progress";

export function registerStudentProgressRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.post(
    "/api/students/:studentId/topics/:topicId/complete",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER, UserRole.TEACHER]),
    completeStudentTopic
  );
  app.get("/api/students/:studentId/progress", isAuthenticated, getStudentProgressHandler);
}
