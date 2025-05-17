import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  addStudent,
  getStudentById,
  getStudentsByParent,
  getAllStudents,
  getStudentsByProgram
} from "../handlers/students";

export function registerStudentRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get(
    "/api/students/all",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    getAllStudents
  );
  app.post("/api/students", isAuthenticated, addStudent);
  app.get("/api/students", isAuthenticated, getStudentsByParent);
  app.get("/api/students/:studentId", isAuthenticated, getStudentById);
  app.get(
    "/api/programs/:programId/students",
    isAuthenticated,
    hasRole([UserRole.ADMIN, UserRole.OWNER]),
    getStudentsByProgram
  );
}
