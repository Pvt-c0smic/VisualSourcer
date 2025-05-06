import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Zod schema for skillset ID validation
const skillSetIdsSchema = z.object({
  skillSetIds: z.array(z.number())
});

/**
 * Get all skill sets
 */
export async function getSkillSets(req: Request, res: Response) {
  try {
    const skillSets = await storage.getAllSkillSets();
    res.json(skillSets);
  } catch (error) {
    console.error("Error fetching skill sets:", error);
    res.status(500).json({ message: "Failed to fetch skill sets" });
  }
}

/**
 * Get all skill set categories
 */
export async function getSkillSetCategories(req: Request, res: Response) {
  try {
    const categories = await storage.getSkillSetCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching skill set categories:", error);
    res.status(500).json({ message: "Failed to fetch skill set categories" });
  }
}

/**
 * Get a single skill set by ID
 */
export async function getSkillSetById(req: Request, res: Response) {
  try {
    const skillSetId = parseInt(req.params.id);
    
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

/**
 * Update user's skill sets
 */
export async function updateUserSkillSets(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Make sure the user exists
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check that the current user is either an admin or the user being updated
    const currentUser = req.user as any;
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update this user's skill sets" });
    }
    
    // Validate request data
    const validationResult = skillSetIdsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: validationResult.error.errors
      });
    }
    
    const { skillSetIds } = validationResult.data;
    
    // Update user's skill sets
    const updatedUser = await storage.updateUserSkillSets(userId, skillSetIds);
    
    res.status(200).json({
      message: "User skill sets updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user skill sets:", error);
    res.status(500).json({ message: "Failed to update user skill sets" });
  }
}