import type { Express } from "express";
import { handleContactUs } from "../handlers/utilities";

export function registerContactRoutes(app: Express) {
  app.post("/api/contact", handleContactUs);
}
