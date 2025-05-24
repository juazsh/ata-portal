import type { Express } from "express";
import {
  addPayment,
  removePayment,
  getPaymentMethods,
  createStripeCustomer
} from "../handlers/payment";

export function registerPaymentRoutes(app: Express, isAuthenticated: any) {
  app.post("/api/payments", isAuthenticated, addPayment);
  app.get("/api/payments/:userId", isAuthenticated, getPaymentMethods);
  app.delete("/api/payments/:paymentId", isAuthenticated, removePayment);
  app.post("/api/stripe/create-customer", createStripeCustomer);
}
