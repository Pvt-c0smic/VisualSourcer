import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Get all skill sets
export async function getSkillSets(req: Request, res: Response) {
  try {
    // Check if authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Get query parameters for filtering
    const category = req.query.category as string | undefined;
    
    // Get skill sets with optional filtering by category
    const skillSets = category 
      ? await storage.getSkillSetsByCategory(category)
      : await storage.getAllSkillSets();
    
    res.json(skillSets);
  } catch (error) {
    console.error("Error fetching skill sets:", error);
    res.status(500).json({ message: "Failed to fetch skill sets" });
  }
}

// Get skill set categories
export async function getSkillSetCategories(req: Request, res: Response) {
  try {
    // Check if authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const categories = await storage.getSkillSetCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching skill set categories:", error);
    res.status(500).json({ message: "Failed to fetch skill set categories" });
  }
}

// Get skill set by ID
export async function getSkillSetById(req: Request, res: Response) {
  try {
    // Check if authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const skillSetId = parseInt(id, 10);
    
    if (isNaN(skillSetId)) {
      return res.status(400).json({ message: "Invalid skill set ID" });
    }
    
    const skillSet = await storage.getSkillSetById(skillSetId);
    
    if (!skillSet) {
      return res.status(404).json({ message: "Skill set not found" });
    }
    
    res.json(skillSet);
  } catch (error) {
    console.error("Error fetching skill set:", error);
    res.status(500).json({ message: "Failed to fetch skill set" });
  }
}

// Update user's skill sets
export async function updateUserSkillSets(req: Request, res: Response) {
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
    
    // Regular users can only update their own skill sets
    const currentUser = req.user as any;
    if (currentUser.role !== 'admin' && userId !== currentUser.id) {
      return res.status(403).json({ message: "You don't have permission to update this user's skill sets" });
    }
    
    // Validate request body
    const skillSetsSchema = z.object({
      skillSetIds: z.array(z.number())
    });
    
    const validatedData = skillSetsSchema.parse(req.body);
    
    // Update user's skill sets
    const updatedUser = await storage.updateUserSkillSets(userId, validatedData.skillSetIds);
    
    // Remove sensitive data
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating user skill sets:", error);
    res.status(500).json({ message: "Failed to update user skill sets" });
  }
}