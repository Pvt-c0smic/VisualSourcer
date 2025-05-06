import { Request, Response } from "express";
import { db } from "@db";
import { storage } from "../storage";
import { programs, insertProgramSchema, programEnrollments } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Get all programs
export async function getPrograms(req: Request, res: Response) {
  try {
    const allPrograms = await storage.getAllPrograms();
    
    // Add enrolled count to each program
    const programsWithCounts = await Promise.all(
      allPrograms.map(async (program) => {
        const enrolledCount = await storage.getProgramEnrollmentCount(program.id);
        return {
          ...program,
          enrolledCount,
        };
      })
    );
    
    res.json(programsWithCounts);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
}

// Get program by ID
export async function getProgramById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const programId = parseInt(id, 10);
    
    if (isNaN(programId)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }
    
    const program = await storage.getProgramById(programId);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    // Get enrolled count
    const enrolledCount = await storage.getProgramEnrollmentCount(programId);
    
    // Get creator info
    const creator = await storage.getUserById(program.createdById);
    
    // Get skill set info
    const skillSet = await storage.getSkillSetById(program.skillSetId);
    
    res.json({
      ...program,
      enrolledCount,
      createdBy: creator ? creator.name : "Unknown",
      skillSetCategory: skillSet ? skillSet.category : "Unknown",
    });
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ message: "Failed to fetch program" });
  }
}

// Create a new program
export async function createProgram(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    
    // Validate request body
    const validatedData = insertProgramSchema.parse(req.body);
    
    // Create program
    const newProgram = await storage.createProgram({
      ...validatedData,
      createdById: user.id,
    });
    
    res.status(201).json(newProgram);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error creating program:", error);
    res.status(500).json({ message: "Failed to create program" });
  }
}

// Update a program
export async function updateProgram(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const programId = parseInt(id, 10);
    
    if (isNaN(programId)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }
    
    const program = await storage.getProgramById(programId);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    // Check if user has permission to update this program
    const user = req.user as any;
    if (user.role !== 'admin' && program.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to update this program" });
    }
    
    // Validate request body
    const validatedData = insertProgramSchema.parse(req.body);
    
    // Update program
    const updatedProgram = await storage.updateProgram(programId, validatedData);
    
    res.json(updatedProgram);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Failed to update program" });
  }
}

// Delete a program
export async function deleteProgram(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const programId = parseInt(id, 10);
    
    if (isNaN(programId)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }
    
    const program = await storage.getProgramById(programId);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    // Check if user has permission to delete this program
    const user = req.user as any;
    if (user.role !== 'admin' && program.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to delete this program" });
    }
    
    // Delete program
    await storage.deleteProgram(programId);
    
    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Failed to delete program" });
  }
}

// Get program enrollees
export async function getProgramEnrollees(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const programId = parseInt(id, 10);
    
    if (isNaN(programId)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }
    
    const program = await storage.getProgramById(programId);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    const enrollments = await storage.getProgramEnrollments(programId);
    
    // Get user details for each enrollment
    const enrolleesWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const user = await storage.getUserById(enrollment.userId);
        if (!user) return null;
        
        // Don't return sensitive info like password
        const { password, ...userWithoutPassword } = user;
        
        return {
          ...userWithoutPassword,
          enrollmentDate: enrollment.enrollmentDate,
          enrollmentStatus: enrollment.status,
          progress: enrollment.progress,
        };
      })
    );
    
    // Filter out null values (in case a user was deleted)
    const validEnrollees = enrolleesWithDetails.filter(Boolean);
    
    res.json(validEnrollees);
  } catch (error) {
    console.error("Error fetching program enrollees:", error);
    res.status(500).json({ message: "Failed to fetch program enrollees" });
  }
}

// Enroll in a program
export async function enrollInProgram(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const programId = parseInt(id, 10);
    
    if (isNaN(programId)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }
    
    const program = await storage.getProgramById(programId);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    const user = req.user as any;
    
    // Check if user is already enrolled
    const existingEnrollment = await storage.getEnrollment(programId, user.id);
    
    if (existingEnrollment) {
      return res.status(400).json({ message: "User is already enrolled in this program" });
    }
    
    // Check if program is full
    const enrolledCount = await storage.getProgramEnrollmentCount(programId);
    
    if (enrolledCount >= program.capacity) {
      return res.status(400).json({ message: "Program is already full" });
    }
    
    // Enroll user
    const enrollment = await storage.enrollUserInProgram(programId, user.id);
    
    // Update program status if it's now full
    if (enrolledCount + 1 >= program.capacity) {
      await storage.updateProgramStatus(programId, "Full");
    }
    
    res.status(201).json(enrollment);
  } catch (error) {
    console.error("Error enrolling in program:", error);
    res.status(500).json({ message: "Failed to enroll in program" });
  }
}

// Unenroll from a program
export async function unenrollFromProgram(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const programId = parseInt(id, 10);
    
    if (isNaN(programId)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }
    
    const program = await storage.getProgramById(programId);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    const user = req.user as any;
    
    // Check if user is enrolled
    const enrollment = await storage.getEnrollment(programId, user.id);
    
    if (!enrollment) {
      return res.status(400).json({ message: "User is not enrolled in this program" });
    }
    
    // Unenroll user
    await storage.unenrollUserFromProgram(programId, user.id);
    
    // Update program status if it was full but now has a spot
    if (program.status === "Full") {
      await storage.updateProgramStatus(programId, "Open");
    }
    
    res.json({ message: "Successfully unenrolled from program" });
  } catch (error) {
    console.error("Error unenrolling from program:", error);
    res.status(500).json({ message: "Failed to unenroll from program" });
  }
}

// Complete a program
export async function completeProgram(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const programId = parseInt(id, 10);
    
    if (isNaN(programId)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }
    
    const program = await storage.getProgramById(programId);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    // Only admin or program creator can complete a program
    const user = req.user as any;
    if (user.role !== 'admin' && program.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to complete this program" });
    }
    
    // Update program status
    await storage.updateProgramStatus(programId, "Completed");
    
    // Update all enrollments to completed
    await storage.completeAllEnrollments(programId);
    
    res.json({ message: "Program completed successfully" });
  } catch (error) {
    console.error("Error completing program:", error);
    res.status(500).json({ message: "Failed to complete program" });
  }
}
