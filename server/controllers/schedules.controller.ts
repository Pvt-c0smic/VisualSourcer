import { Request, Response } from "express";
import { db } from "@db";
import { storage } from "../storage";
import { events, insertEventSchema, eventParticipants } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";

// Get all events
export async function getEvents(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    
    // Get query parameters for filtering
    const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
    const endDate = req.query.end ? new Date(req.query.end as string) : undefined;
    const type = req.query.type as string | undefined;
    
    // Get events visible to the user
    let events = await storage.getUserVisibleEvents(user.id, startDate, endDate, type);
    
    // Convert to calendar event format
    const calendarEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.startTime.toISOString(),
      end: event.endTime.toISOString(),
      location: event.location,
      type: event.type,
      venueType: event.venueType,
      required: event.required,
      createdById: event.createdById,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));
    
    res.json(calendarEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
}

// Create a new event
export async function createEvent(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    
    // Validate request body
    const validatedData = insertEventSchema.parse(req.body);
    
    // Create event
    const newEvent = await storage.createEvent({
      ...validatedData,
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime),
      createdById: user.id,
    });
    
    // Add participants if provided
    if (Array.isArray(req.body.participants) && req.body.participants.length > 0) {
      await Promise.all(
        req.body.participants.map(async (participantId: number) => {
          return storage.addEventParticipant(newEvent.id, participantId);
        })
      );
      
      // Add creator as participant if not already included
      if (!req.body.participants.includes(user.id)) {
        await storage.addEventParticipant(newEvent.id, user.id);
      }
    }
    
    // Format response
    const calendarEvent = {
      id: newEvent.id,
      title: newEvent.title,
      description: newEvent.description,
      start: newEvent.startTime.toISOString(),
      end: newEvent.endTime.toISOString(),
      location: newEvent.location,
      type: newEvent.type,
      venueType: newEvent.venueType,
      required: newEvent.required,
      createdById: newEvent.createdById,
      createdAt: newEvent.createdAt.toISOString(),
      updatedAt: newEvent.updatedAt.toISOString(),
    };
    
    res.status(201).json(calendarEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
}

// Update an event
export async function updateEvent(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const eventId = parseInt(id, 10);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    
    const event = await storage.getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if user has permission to update this event
    const user = req.user as any;
    if (user.role !== 'admin' && event.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to update this event" });
    }
    
    // Validate request body
    const updateEventSchema = z.object({
      title: z.string().min(3).optional(),
      description: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      venueType: z.enum(["VTC", "Face-to-Face"]).optional(),
      required: z.boolean().optional(),
      participants: z.array(z.number()).optional(),
    });
    
    const validatedData = updateEventSchema.parse(req.body);
    
    // Build update object
    const updateData: any = {};
    
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.startTime) updateData.startTime = new Date(validatedData.startTime);
    if (validatedData.endTime) updateData.endTime = new Date(validatedData.endTime);
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.venueType) updateData.venueType = validatedData.venueType;
    if (validatedData.required !== undefined) updateData.required = validatedData.required;
    
    // Update event
    const updatedEvent = await storage.updateEvent(eventId, updateData);
    
    // Update participants if provided
    if (Array.isArray(validatedData.participants)) {
      // Remove current participants
      await storage.removeAllEventParticipants(eventId);
      
      // Add new participants
      await Promise.all(
        validatedData.participants.map(async (participantId: number) => {
          return storage.addEventParticipant(eventId, participantId);
        })
      );
      
      // Add creator as participant if not already included
      if (!validatedData.participants.includes(user.id)) {
        await storage.addEventParticipant(eventId, user.id);
      }
    }
    
    // Format response
    const calendarEvent = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      start: updatedEvent.startTime.toISOString(),
      end: updatedEvent.endTime.toISOString(),
      location: updatedEvent.location,
      type: updatedEvent.type,
      venueType: updatedEvent.venueType,
      required: updatedEvent.required,
      createdById: updatedEvent.createdById,
      createdAt: updatedEvent.createdAt.toISOString(),
      updatedAt: updatedEvent.updatedAt.toISOString(),
    };
    
    res.json(calendarEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
}

// Delete an event
export async function deleteEvent(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const eventId = parseInt(id, 10);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    
    const event = await storage.getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if user has permission to delete this event
    const user = req.user as any;
    if (user.role !== 'admin' && event.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to delete this event" });
    }
    
    // Delete event and its participants
    await storage.deleteEvent(eventId);
    
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Failed to delete event" });
  }
}
