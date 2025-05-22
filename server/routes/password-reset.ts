import type { Express } from "express";
import { 
  createPasswordResetRequest, 
  verifyPasswordResetCode,
  verifyPasswordResetLink,
  resetPassword 
} from "../handlers/password-reset";

export function registerPasswordResetRoutes(app: Express) {
  
  app.post("/api/password-reset/request", createPasswordResetRequest);
  app.post("/api/password-reset/verify", verifyPasswordResetCode);
  app.get("/api/password-reset/verify-link", verifyPasswordResetLink);
  app.post("/api/password-reset/reset", resetPassword);
}