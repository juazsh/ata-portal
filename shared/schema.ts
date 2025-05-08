import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username"),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"),
  profilePicture: text("profile_picture").default("https://ui-avatars.com/api/?name=User&background=3b82f6&color=ffffff"),
  active: boolean("active").default(true),
});

export const insertUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().optional(),
  role: z.string().optional(),
  profilePicture: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().min(3, "Email or username must be at least 3 characters"),
  password: z.string().min(1, "Password is required")
})

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;

// Role types
export const UserRoles = {
  ADMIN: "admin",
  PARENT: "parent",
  STUDENT: "student",
  TEACHER: "teacher",
  OWNER: "owner"
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];