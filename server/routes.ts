import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { registerAuthRoutes } from "./routes/auth";
import { registerRegistrationRoutes } from "./routes/registrations";
import { registerDemoRegistrationRoutes } from "./routes/demo-registrations";
import { registerSessionRoutes } from "./routes/sessions";
import { registerUserRoutes } from "./routes/users";
import { registerStudentProgressRoutes } from "./routes/student-progress";
import { registerStudentRoutes } from "./routes/students";
import { registerContactRoutes } from "./routes/contact";
import { registerPaymentRoutes } from "./routes/payments";
import { registerProgramRoutes } from "./routes/programs";
import { registerOfferingRoutes } from "./routes/offerings";
import { registerModuleRoutes } from "./routes/modules";
import { registerTopicRoutes } from "./routes/topics";
import { registerEnrollmentRoutes } from "./routes/enrollments";
import { registerDiscountCodeRoutes } from "./routes/discount-codes";
import { registerPayPalRoutes } from "./routes/paypal";
import { registerPasswordResetRoutes } from "./routes/password-reset";
import { registerPlanRoutes } from "./routes/plans";
import { registerCronTestRoutes } from "./routes/test-cron";
import { registerLocationRoutes } from "./routes/locations";

import transactionsRouter from './routes/transactions';

export async function registerRoutes(app: Express): Promise<Server> {
  const { isAuthenticated, hasRole } = await setupAuth(app);

  registerAuthRoutes(app);
  registerPasswordResetRoutes(app);
  registerRegistrationRoutes(app, isAuthenticated, hasRole);
  registerDemoRegistrationRoutes(app, isAuthenticated, hasRole);
  registerLocationRoutes(app, isAuthenticated, hasRole);
  registerSessionRoutes(app, isAuthenticated, hasRole);
  registerPlanRoutes(app, isAuthenticated, hasRole);
  registerUserRoutes(app, isAuthenticated, hasRole);
  registerStudentProgressRoutes(app, isAuthenticated, hasRole);
  registerStudentRoutes(app, isAuthenticated, hasRole);
  registerContactRoutes(app);
  registerPaymentRoutes(app, isAuthenticated);
  registerProgramRoutes(app, isAuthenticated, hasRole);
  registerOfferingRoutes(app, isAuthenticated, hasRole);
  registerModuleRoutes(app, isAuthenticated, hasRole);
  registerTopicRoutes(app, isAuthenticated, hasRole);
  registerEnrollmentRoutes(app, isAuthenticated, hasRole);
  registerDiscountCodeRoutes(app, isAuthenticated, hasRole);
  registerPayPalRoutes(app, isAuthenticated);
  registerCronTestRoutes(app, isAuthenticated, hasRole);
  app.use('/api/transactions', transactionsRouter);

  const httpServer = createServer(app);
  return httpServer;
}

