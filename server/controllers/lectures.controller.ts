import { Request, Response } from "express";
import { z } from "zod";
import * as storage from "../storage";

// Get all lectures (with filtering by module, program, creator)
export async function getLectures(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { moduleId, programId, createdById } = req.query;
    
    const filters: any = {};
    if (moduleId) filters.moduleId = parseInt(moduleId as string, 10);
    if (programId) filters.programId = parseInt(programId as string, 10);
    if (createdById) filters.createdById = parseInt(createdById as string, 10);

    const lectures = await storage.getLectures(filters);
    res.json(lectures);
  } catch (error) {
    console.error("Error fetching lectures:", error);
    res.status(500).json({ message: "Failed to fetch lectures" });
  }
}

// Get lecture by ID
export async function getLectureById(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const lectureId = parseInt(req.params.id, 10);
    
    if (isNaN(lectureId)) {
      return res.status(400).json({ message: "Invalid lecture ID" });
    }

    const lecture = await storage.getLectureById(lectureId);
    
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    res.json(lecture);
  } catch (error) {
    console.error("Error fetching lecture:", error);
    res.status(500).json({ message: "Failed to fetch lecture" });
  }
}

// Create a new lecture
export async function createLecture(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    
    // Check if user is a trainer
    if (user.role !== 'trainer' && user.role !== 'admin') {
      return res.status(403).json({ message: "Only trainers can create lectures" });
    }

    const lectureSchema = z.object({
      moduleId: z.number(),
      title: z.string().min(3, "Title must be at least 3 characters"),
      content: z.string().min(1, "Content is required"),
      attachments: z.array(
        z.object({
          name: z.string(),
          url: z.string(),
          type: z.string(),
          size: z.number().optional(),
        })
      ).optional(),
    });

    const validatedData = lectureSchema.parse(req.body);
    
    // First, check if the module exists and the user has permission
    const module = await storage.getProgramModuleById(validatedData.moduleId);
    
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    
    // Check if user is allowed to create content for this module's program
    const program = await storage.getProgramById(module.programId);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    if (program.createdById !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to add lectures to this program" });
    }

    // Create the lecture
    const newLecture = await storage.createLecture({
      ...validatedData,
      createdById: user.id,
    });

    res.status(201).json(newLecture);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error creating lecture:", error);
    res.status(500).json({ message: "Failed to create lecture" });
  }
}

// Update a lecture
export async function updateLecture(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const lectureId = parseInt(req.params.id, 10);
    
    if (isNaN(lectureId)) {
      return res.status(400).json({ message: "Invalid lecture ID" });
    }

    // Check if lecture exists
    const lecture = await storage.getLectureById(lectureId);
    
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }
    
    // Check permissions
    if (lecture.createdById !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to update this lecture" });
    }

    const lectureSchema = z.object({
      title: z.string().min(3, "Title must be at least 3 characters").optional(),
      content: z.string().min(1, "Content is required").optional(),
      attachments: z.array(
        z.object({
          name: z.string(),
          url: z.string(),
          type: z.string(),
          size: z.number().optional(),
        })
      ).optional(),
    });

    const validatedData = lectureSchema.parse(req.body);
    
    // Update the lecture
    const updatedLecture = await storage.updateLecture(lectureId, validatedData);
    
    res.json(updatedLecture);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating lecture:", error);
    res.status(500).json({ message: "Failed to update lecture" });
  }
}

// Delete a lecture
export async function deleteLecture(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const lectureId = parseInt(req.params.id, 10);
    
    if (isNaN(lectureId)) {
      return res.status(400).json({ message: "Invalid lecture ID" });
    }

    // Check if lecture exists
    const lecture = await storage.getLectureById(lectureId);
    
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }
    
    // Check permissions
    if (lecture.createdById !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to delete this lecture" });
    }

    // Delete the lecture
    await storage.deleteLecture(lectureId);
    
    res.json({ message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({ message: "Failed to delete lecture" });
  }
}

// Get lectures by module
export async function getLecturesByModule(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const moduleId = parseInt(req.params.moduleId, 10);
    
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }

    const lectures = await storage.getLectures({ moduleId });
    
    res.json(lectures);
  } catch (error) {
    console.error("Error fetching lectures by module:", error);
    res.status(500).json({ message: "Failed to fetch lectures by module" });
  }
}

// Mark lecture as completed by trainee
export async function markLectureCompleted(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    
    // Only trainees can mark lectures as completed
    if (user.role !== 'trainee') {
      return res.status(403).json({ message: "Only trainees can mark lectures as completed" });
    }
    
    const lectureId = parseInt(req.params.id, 10);
    
    if (isNaN(lectureId)) {
      return res.status(400).json({ message: "Invalid lecture ID" });
    }

    // Check if lecture exists
    const lecture = await storage.getLectureById(lectureId);
    
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    // Mark lecture as completed
    const module = await storage.getProgramModuleById(lecture.moduleId);
    
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    
    // Check if user is enrolled in the program
    const enrollment = await storage.getProgramEnrollment(module.programId, user.id);
    
    if (!enrollment) {
      return res.status(403).json({ message: "You must be enrolled in this program to mark lectures as completed" });
    }
    
    // Update progress
    await storage.markLectureCompleted(lectureId, user.id);
    await storage.updateProgramEnrollmentProgress(module.programId, user.id);
    
    res.json({ message: "Lecture marked as completed" });
  } catch (error) {
    console.error("Error marking lecture as completed:", error);
    res.status(500).json({ message: "Failed to mark lecture as completed" });
  }
}