import type { Express } from "express";
import { handlePayPalSuccess, handlePayPalCancel } from "../handlers/helpers/process-paypal-payment";

export function registerPayPalRoutes(app: Express, isAuthenticated: any) {
  app.get('/enrollments/success', isAuthenticated, handlePayPalSuccess);
  app.get('/enrollments/cancel', isAuthenticated, handlePayPalCancel);
}
