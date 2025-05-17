import type { Express } from "express";
import { UserRole } from "../models/user";
import {
  addTopic,
  getAllTopics,
  getTopicById,
  getTopicsByModule,
  updateTopic,
  deleteTopic
} from "../handlers/topics";

export function registerTopicRoutes(
  app: Express,
  isAuthenticated: any,
  hasRole: (roles: UserRole[]) => any
) {
  app.get("/api/topics", isAuthenticated, getAllTopics);
  app.get("/api/topics/:topicId", isAuthenticated, getTopicById);
  app.get("/api/modules/:moduleId/topics", isAuthenticated, getTopicsByModule);
  app.post("/api/topics", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), addTopic);
  app.put("/api/topics/:topicId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), updateTopic);
  app.delete("/api/topics/:topicId", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.OWNER]), deleteTopic);
}
