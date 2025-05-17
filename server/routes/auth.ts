import type { Express } from "express";
import { UserRole } from "../models/user";
import { setupAuth } from "../auth";
import { createPortalAccount } from "../handlers/portal-account";

export async function registerAuthRoutes(app: Express) {
  const { isAuthenticated, hasRole } = await setupAuth(app);

  app.post("/api/create-portal-account", createPortalAccount);
}
