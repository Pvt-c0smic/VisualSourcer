import { Request, Response } from "express";
import { db } from "@db";
import { storage } from "../storage";
import { users, insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";

// Get all users
export async function getUsers(req: Request, res: Response) {
  try {
    // Check if authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Get query parameters for filtering
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    
    // Get users with optional filtering
    const allUsers = await storage.getAllUsers(role, search);
    
    // Remove sensitive information like passwords
    const sanitizedUsers = allUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(sanitizedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

// Get user by ID
export async function getUserById(req: Request, res: Response) {
  try {
    // Check if authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const userId = parseInt(id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Regular users can only get their own data
    const currentUser = req.user as any;
    if (currentUser.role !== 'admin' && userId !== currentUser.id) {
      return res.status(403).json({ message: "You don't have permission to view this user" });
    }
    
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

// Create a new user
export async function createUser(req: Request, res: Response) {
  try {
    // Check if authenticated and is admin
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can create users" });
    }
    
    // Validate request body
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
    const newUser = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
    });
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = newUser;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
}

// Update a user
export async function updateUser(req: Request, res: Response) {
  try {
    // Check if authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const userId = parseInt(id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Regular users can only update their own data, admins can update any user
    const currentUser = req.user as any;
    if (currentUser.role !== 'admin' && userId !== currentUser.id) {
      return res.status(403).json({ message: "You don't have permission to update this user" });
    }
    
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Create a schema for the update request
    const updateUserSchema = z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
      role: z.enum(['admin', 'trainer', 'trainee']).optional(),
      rank: z.string().optional(),
      unit: z.string().optional(),
      avatarUrl: z.string().optional(),
      skillSets: z.array(z.any()).optional(),
    });
    
    // Validate the update data
    const validatedData = updateUserSchema.parse(req.body);
    
    // Regular users can't change their own role
    if (validatedData.role && currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can change user roles" });
    }
    
    // If email is being updated, check if it's already in use
    if (validatedData.email && validatedData.email !== user.email) {
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }
    
    // Hash password if provided
    if (validatedData.password) {
      const saltRounds = 10;
      validatedData.password = await bcrypt.hash(validatedData.password, saltRounds);
    }
    
    // Update user
    const updatedUser = await storage.updateUser(userId, validatedData);
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
}

// Delete a user
export async function deleteUser(req: Request, res: Response) {
  try {
    // Check if authenticated and is admin
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can delete users" });
    }
    
    const { id } = req.params;
    const userId = parseInt(id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Prevent deleting your own account
    if (userId === currentUser.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Delete user
    await storage.deleteUser(userId);
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
}
