import { users, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Add a default admin user
    const adminId = this.currentId++;
    const adminUser: User = {
      id: adminId,
      username: "admin",
      // Fresh hash for "password123" using bcrypt
      password: "$2b$10$agMeMtqA/qkbP.9SN.CN8.etADZRkJnsROWTq7o8ogaYGv2AS8uqG", 
      email: "admin@example.com",
      fullName: "Admin User",
      role: "admin",
      profilePicture: "https://ui-avatars.com/api/?name=Admin+User&background=3b82f6&color=ffffff"
    };
    this.users.set(adminId, adminUser);
    
    // Add a parent user
    const parentId = this.currentId++;
    const parentUser: User = {
      id: parentId,
      username: "parent",
      password: "$2b$10$agMeMtqA/qkbP.9SN.CN8.etADZRkJnsROWTq7o8ogaYGv2AS8uqG", // Same password: password123
      email: "parent@example.com",
      fullName: "Parent User",
      role: "parent",
      profilePicture: "https://ui-avatars.com/api/?name=Parent+User&background=f59e0b&color=ffffff"
    };
    this.users.set(parentId, parentUser);
    
    // Add a student user
    const studentId = this.currentId++;
    const studentUser: User = {
      id: studentId,
      username: "student",
      password: "$2b$10$agMeMtqA/qkbP.9SN.CN8.etADZRkJnsROWTq7o8ogaYGv2AS8uqG", // Same password: password123
      email: "student@example.com",
      fullName: "Student User",
      role: "student",
      profilePicture: "https://ui-avatars.com/api/?name=Student+User&background=10b981&color=ffffff"
    };
    this.users.set(studentId, studentUser);
    
    // Add a teacher user
    const teacherId = this.currentId++;
    const teacherUser: User = {
      id: teacherId,
      username: "teacher",
      password: "$2b$10$agMeMtqA/qkbP.9SN.CN8.etADZRkJnsROWTq7o8ogaYGv2AS8uqG", // Same password: password123
      email: "teacher@example.com",
      fullName: "Teacher User",
      role: "teacher",
      profilePicture: "https://ui-avatars.com/api/?name=Teacher+User&background=8b5cf6&color=ffffff"
    };
    this.users.set(teacherId, teacherUser);
    
    // Add an owner user
    const ownerId = this.currentId++;
    const ownerUser: User = {
      id: ownerId,
      username: "owner",
      password: "$2b$10$agMeMtqA/qkbP.9SN.CN8.etADZRkJnsROWTq7o8ogaYGv2AS8uqG", // Same password: password123
      email: "owner@example.com",
      fullName: "Owner User",
      role: "owner",
      profilePicture: "https://ui-avatars.com/api/?name=Owner+User&background=ec4899&color=ffffff"
    };
    this.users.set(ownerId, ownerUser);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    // Make sure required fields have default values
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "student",
      profilePicture: insertUser.profilePicture || "https://ui-avatars.com/api/?name=User&background=3b82f6&color=ffffff"
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

export const storage = new MemStorage();
