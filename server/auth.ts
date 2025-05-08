import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { connectToDatabase, User } from "./lib/mongodb";
import { loginUserSchema } from "@shared/schema";
import { UserRole } from "./models/user";

const JWT_SECRET = process.env.JWT_SECRET || "fusionmind-jwt-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

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

// >> Password hashing
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// >> Generate JWT token
function generateToken(user: Express.User): string {
  const payload = {
    sub: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function setupAuth(app: Express) {
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.user = user;
      next();
    })(req, res, next);
  };

  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        if (!roles.includes(user.role)) {
          return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
        }

        req.user = user;
        next();
      })(req, res, next);
    };
  };

  await connectToDatabase();

  app.use(passport.initialize());

  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
  };

  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const user = {
          id: payload.sub,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          role: payload.role,
          active: true,
          profilePicture: payload.profilePicture
        };

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    })
  );

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (emailOrUsername, password, done) => {
        try {
          console.log("[auth] Login attempt for email/username:", emailOrUsername);

          // Check if the input is an email or username
          const user = await User.findOne({
            $or: [
              { email: emailOrUsername },
              { username: emailOrUsername }
            ]
          });

          if (!user) {
            console.log("[auth] User not found");
            return done(null, false, { message: "Incorrect email/username or password" });
          }

          if (!user.active) {
            console.log("[auth] User account is deactivated");
            return done(null, false, { message: "Account is deactivated" });
          }

          console.log("[auth] User found, comparing passwords");
          const isValidPassword = await user.comparePassword(password);

          if (!isValidPassword) {
            console.log("[auth] Invalid password");
            return done(null, false, { message: "Incorrect email/username or password" });
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
      const userObj = {
        id: newUser._id.toString(),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        active: newUser.active,
        profilePicture: newUser.profilePicture
      };

      const token = generateToken(userObj);

      return res.status(201).json({
        user: userResponse,
        token
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

      passport.authenticate("local", { session: false }, (err: any, user: Express.User, info: any) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(401).json({ message: info.message || "Invalid credentials" });
        }

        const token = generateToken(user);

        console.log('Login successful, token generated');

        return res.json({
          token,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            active: user.active,
            profilePicture: user.profilePicture
          }
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

  const tokenBlacklist = new Set<string>();

  app.post("/api/logout", isAuthenticated, (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      tokenBlacklist.add(token);
    }

    res.status(200).json({ message: "Logged out successfully" });
  });

  app.get("/api/user", isAuthenticated, (req, res) => {
    res.json(req.user);
  });

  return { isAuthenticated, hasRole };
}