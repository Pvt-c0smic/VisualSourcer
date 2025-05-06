import { Request, Response } from "express";
import { Strategy as LocalStrategy } from "passport-local";
import { PassportStatic } from "passport";
import { db } from "@db";
import { users, insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { z } from "zod";

// Configure Passport
export function configurePassport(passport: PassportStatic) {
  // Passport serialize/deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Local strategy for username/password login
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect password." });
        }
        
        // Don't include password in the returned user object
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    })
  );
}

// Login controller
export async function login(req: Request, res: Response) {
  try {
    // Passport.authenticate returns a function that we need to invoke
    return new Promise((resolve, reject) => {
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Internal server error" });
        }
        
        if (!user) {
          return res.status(401).json({ message: info.message || "Authentication failed" });
        }
        
        // Log in the user
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res.status(500).json({ message: "Failed to login" });
          }
          
          return res.json(user);
        });
      })(req, res);
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Logout controller
export async function logout(req: Request, res: Response) {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to logout" });
    }
    
    res.json({ message: "Logged out successfully" });
  });
}

// Register controller
export async function register(req: Request, res: Response) {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if username or email already exists
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    const existingEmail = await storage.getUserByEmail(validatedData.email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);
    
    // Create user with hashed password
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
    });
    
    // Don't return password in response
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
}

// Get current user
export async function getCurrentUser(req: Request, res: Response) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  // User is already attached to req by passport
  const user = req.user;
  
  res.json(user);
}
