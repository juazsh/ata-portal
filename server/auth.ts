import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import bcrypt from "bcrypt";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { connectToDatabase, User } from "./lib/mongodb";
import { loginUserSchema } from "@shared/schema";
import { UserRole } from "./models/user";

declare global {
  namespace Express {
    interface User {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      active: boolean;
      profilePicture?: string;
    }
  }
}

// Password hashing
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function setupAuth(app: Express) {
  // Define middleware functions early
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Role-based authorization middleware
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
      }

      next();
    };
  };

  await connectToDatabase();

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fusionmind-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/fusionmind-portal',
      collectionName: 'sessions',
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());


  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          console.log("[auth] Login attempt for email:", email);
          const user = await User.findOne({ email });

          if (!user) {
            console.log("[auth] User not found");
            return done(null, false, { message: "Incorrect email or password" });
          }

          if (!user.active) {
            console.log("[auth] User account is deactivated");
            return done(null, false, { message: "Account is deactivated" });
          }

          console.log("[auth] User found, comparing passwords");
          const isValidPassword = await user.comparePassword(password);

          if (!isValidPassword) {
            console.log("[auth] Invalid password");
            return done(null, false, { message: "Incorrect email or password" });
          }

          console.log("[auth] Login successful");

          const userObj = {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            active: user.active,
            profilePicture: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + '+' + user.lastName)}&background=3b82f6&color=ffffff`
          };

          return done(null, userObj);
        } catch (error) {
          console.error("[auth] Login error:", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id).select('-password');
      if (!user) {
        return done(null, false);
      }

      const userObj = {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        active: user.active,
        profilePicture: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + '+' + user.lastName)}&background=3b82f6&color=ffffff`
      };

      done(null, userObj);
    } catch (error) {
      done(error);
    }
  });


  app.post("/api/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;


      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);

      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || UserRole.PARENT,
        active: true,
        profilePicture: req.body.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + '+' + lastName)}&background=3b82f6&color=ffffff`
      });

      await newUser.save();

      const userResponse = newUser.toObject();
      delete userResponse.password;

      // Login the user
      req.login({
        id: newUser._id.toString(),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        active: newUser.active,
        profilePicture: newUser.profilePicture
      }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json(userResponse);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Registration error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });


  app.post("/api/login", (req, res, next) => {
    try {

      loginUserSchema.parse(req.body);

      const rememberMe = req.body.rememberMe === true;

      if (rememberMe && req.session.cookie) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      passport.authenticate("local", (err: any, user: Express.User, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message || "Invalid credentials" });
        }

        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          console.log('Login successful, session:', {
            id: req.sessionID,
            user: req.user
          });
          return res.json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            active: user.active,
            profilePicture: user.profilePicture
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });


  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(req.user);
  });

  return { isAuthenticated, hasRole };
}