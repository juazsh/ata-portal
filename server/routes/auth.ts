import type { Express } from "express";
import { createPortalAccount } from "../handlers/portal-account";

export async function registerAuthRoutes(app: Express) {
  app.post("/api/create-portal-account", createPortalAccount);
}
