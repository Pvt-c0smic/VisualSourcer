import { Request, Response } from "express";
import { db } from "@db";
import { storage } from "../storage";
import { meetings, insertMeetingSchema, meetingParticipants, events } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { suggestMeetingDateTime } from "../services/openai.service";
import { sendMeetingInvitation } from "../services/mailer.service";

// Get all meetings
export async function getMeetings(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const allMeetings = await storage.getUserMeetings(user.id);
    
    // Enrich with participant information
    const enrichedMeetings = await Promise.all(
      allMeetings.map(async (meeting) => {
        const participants = await storage.getMeetingParticipants(meeting.id);
        return {
          ...meeting,
          participants,
        };
      })
    );
    
    res.json(enrichedMeetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ message: "Failed to fetch meetings" });
  }
}

// Get meeting by ID
export async function getMeetingById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const meetingId = parseInt(id, 10);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ message: "Invalid meeting ID" });
    }
    
    const meeting = await storage.getMeetingById(meetingId);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    
    // Get participants
    const participants = await storage.getMeetingParticipants(meetingId);
    
    res.json({
      ...meeting,
      participants,
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ message: "Failed to fetch meeting" });
  }
}

// Create a new meeting
export async function createMeeting(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    
    // Validate request body
    const validatedData = insertMeetingSchema.parse(req.body);
    
    // Create an event first
    const event = await storage.createEvent({
      title: validatedData.title,
      description: validatedData.description || "",
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime),
      location: validatedData.location || "",
      type: "meeting",
      venueType: validatedData.type,
      createdById: user.id,
    });
    
    // Create meeting linked to the event with enhanced data
    const newMeeting = await storage.createMeeting({
      ...validatedData,
      eventId: event.id,
      tags: req.body.tags || [],
      priority: req.body.priority || "Normal",
      recurrence: req.body.recurrence || "None",
      requiredAttendance: req.body.requiredAttendance || false,
      privateNotes: req.body.privateNotes,
      externalStakeholders: req.body.externalStakeholders || [],
      createdById: user.id,
    });
    
    // Add participants with enhanced data
    if (Array.isArray(req.body.participants) && req.body.participants.length > 0) {
      await Promise.all(
        req.body.participants.map(async (participant: any) => {
          const participantId = typeof participant === 'number' ? participant : participant.userId;
          const participantData = {
            role: participant.role || "Attendee",
            stakeholderType: participant.stakeholderType,
            requiredAttendance: participant.requiredAttendance !== undefined 
              ? participant.requiredAttendance 
              : true
          };
          
          return storage.addMeetingParticipant(
            newMeeting.id, 
            participantId, 
            typeof participant === 'number' 
              ? { role: "Attendee" } 
              : participantData
          );
        })
      );
      
      // Add creator as organizer
      await storage.addMeetingParticipant(newMeeting.id, user.id, {
        role: "Organizer",
        requiredAttendance: true
      });
      
      // Send meeting invitations
      try {
        await Promise.all(
          req.body.participants.map(async (participantId: number) => {
            const participant = await storage.getUserById(participantId);
            if (participant && participant.email) {
              await sendMeetingInvitation(
                participant.email,
                newMeeting.title,
                new Date(newMeeting.startTime),
                new Date(newMeeting.endTime),
                newMeeting.location || "",
                user.name
              );
            }
          })
        );
      } catch (emailError) {
        console.error("Error sending meeting invitations:", emailError);
        // Continue even if email sending fails
      }
    }
    
    // Get participants for response
    const participants = await storage.getMeetingParticipants(newMeeting.id);
    
    res.status(201).json({
      ...newMeeting,
      participants,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error creating meeting:", error);
    res.status(500).json({ message: "Failed to create meeting" });
  }
}

// Update a meeting
export async function updateMeeting(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const meetingId = parseInt(id, 10);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ message: "Invalid meeting ID" });
    }
    
    const meeting = await storage.getMeetingById(meetingId);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    
    // Check if user has permission to update this meeting
    const user = req.user as any;
    if (user.role !== 'admin' && meeting.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to update this meeting" });
    }
    
    // Validate request body
    const validatedData = insertMeetingSchema.parse(req.body);
    
    // Update meeting
    const updatedMeeting = await storage.updateMeeting(meetingId, validatedData);
    
    // Update associated event if it exists
    if (meeting.eventId) {
      await storage.updateEvent(meeting.eventId, {
        title: validatedData.title,
        description: validatedData.description || "",
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        location: validatedData.location || "",
        venueType: validatedData.type,
      });
    }
    
    // Update participants if provided
    if (Array.isArray(req.body.participants)) {
      // Remove current participants (except organizer)
      await storage.removeAllMeetingParticipants(meetingId, ["Attendee", "Presenter"]);
      
      // Add new participants
      await Promise.all(
        req.body.participants.map(async (participant: any) => {
          const participantId = typeof participant === 'number' ? participant : participant.userId;
          const participantData = {
            role: typeof participant === 'number' ? "Attendee" : (participant.role || "Attendee"),
            stakeholderType: typeof participant === 'number' ? undefined : participant.stakeholderType,
            requiredAttendance: typeof participant === 'number' ? true : (participant.requiredAttendance !== undefined ? participant.requiredAttendance : true)
          };
          
          return storage.addMeetingParticipant(meetingId, participantId, participantData);
        })
      );
    }
    
    // Get updated participants for response
    const participants = await storage.getMeetingParticipants(meetingId);
    
    res.json({
      ...updatedMeeting,
      participants,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating meeting:", error);
    res.status(500).json({ message: "Failed to update meeting" });
  }
}

// Delete a meeting
export async function deleteMeeting(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const meetingId = parseInt(id, 10);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ message: "Invalid meeting ID" });
    }
    
    const meeting = await storage.getMeetingById(meetingId);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    
    // Check if user has permission to delete this meeting
    const user = req.user as any;
    if (user.role !== 'admin' && meeting.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to delete this meeting" });
    }
    
    // Delete meeting
    await storage.deleteMeeting(meetingId);
    
    // Delete associated event if it exists
    if (meeting.eventId) {
      await storage.deleteEvent(meeting.eventId);
    }
    
    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ message: "Failed to delete meeting" });
  }
}

// Respond to meeting invitation
export async function respondToMeeting(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const meetingId = parseInt(id, 10);
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ message: "Invalid meeting ID" });
    }
    
    const responseSchema = z.object({
      status: z.enum(["Confirmed", "Declined"]),
      responseMessage: z.string().optional(),
    });
    
    const validatedData = responseSchema.parse(req.body);
    
    const user = req.user as any;
    
    // Check if user is a participant in this meeting
    const participant = await storage.getMeetingParticipantByUserId(meetingId, user.id);
    
    if (!participant) {
      return res.status(404).json({ message: "You are not a participant in this meeting" });
    }
    
    // Update participant status and include response message if provided
    await storage.updateMeetingParticipantStatus(
      participant.id, 
      validatedData.status,
      validatedData.responseMessage
    );
    
    res.json({ message: `Meeting invitation ${validatedData.status.toLowerCase()}` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error responding to meeting:", error);
    res.status(500).json({ message: "Failed to respond to meeting invitation" });
  }
}

// Suggest meeting time using AI
// Update a meeting participant's details
export async function updateMeetingParticipant(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { meetingId, participantId } = req.params;
    const meetingIdNum = parseInt(meetingId, 10);
    const participantIdNum = parseInt(participantId, 10);
    
    if (isNaN(meetingIdNum) || isNaN(participantIdNum)) {
      return res.status(400).json({ message: "Invalid meeting or participant ID" });
    }
    
    const meeting = await storage.getMeetingById(meetingIdNum);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    
    // Check if user has permission to update this meeting's participants
    const user = req.user as any;
    if (user.role !== 'admin' && meeting.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to update this meeting's participants" });
    }
    
    const updateSchema = z.object({
      role: z.string().optional(),
      status: z.enum(["Pending", "Confirmed", "Declined"]).optional(),
      stakeholderType: z.string().optional(),
      responseMessage: z.string().optional(),
      attendance: z.enum(["Present", "Absent", "Excused", "Late"]).optional(),
      requiredAttendance: z.boolean().optional(),
      contributionNotes: z.string().optional(),
    });
    
    const validatedData = updateSchema.parse(req.body);
    
    // Update participant details
    const updatedParticipant = await storage.updateMeetingParticipantDetails(
      participantIdNum, 
      validatedData
    );
    
    if (!updatedParticipant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    
    res.json(updatedParticipant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating meeting participant:", error);
    res.status(500).json({ message: "Failed to update meeting participant" });
  }
}

export async function suggestMeetingTime(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const requestSchema = z.object({
      participantIds: z.array(z.number()),
      participantRoles: z.array(z.object({
        userId: z.number(),
        role: z.string().optional(),
        requiredAttendance: z.boolean().optional()
      })).optional(),
      durationMinutes: z.number().optional(),
      preferredDates: z.array(z.string()).optional(),
      meetingPurpose: z.string().optional(),
      allowRecurring: z.boolean().optional(),
      existingMeetingId: z.number().optional(),
    });
    
    const validatedData = requestSchema.parse(req.body);
    
    // Create a map of participant roles and attendance requirements
    const participantDetailsMap = new Map();
    
    if (validatedData.participantRoles && validatedData.participantRoles.length > 0) {
      validatedData.participantRoles.forEach(p => {
        participantDetailsMap.set(p.userId, {
          role: p.role || "Attendee",
          requiredAttendance: p.requiredAttendance === undefined ? true : p.requiredAttendance
        });
      });
    }
    
    // Get participant schedules with enhanced details
    const participantSchedules = await Promise.all(
      validatedData.participantIds.map(async (participantId) => {
        const user = await storage.getUserById(participantId);
        const events = await storage.getUserEvents(participantId);
        const meetings = await storage.getUserMeetings(participantId);
        
        // Combine events and meetings for complete schedule
        const allEvents = [
          ...events.map(event => ({
            startTime: event.startTime,
            endTime: event.endTime,
            title: event.title || "Calendar Event"
          })),
          ...meetings.map(meeting => ({
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            title: meeting.title || "Meeting"
          }))
        ];
        
        // Get participant details from the map or use defaults
        const details = participantDetailsMap.get(participantId) || { 
          role: "Attendee", 
          requiredAttendance: true 
        };
        
        return {
          userId: participantId,
          name: user ? user.name : `User ${participantId}`,
          role: details.role,
          requiredAttendance: details.requiredAttendance,
          events: allEvents
        };
      })
    );
    
    // Use enhanced OpenAI to suggest optimal meeting time with conflict resolution
    const suggestion = await suggestMeetingDateTime(
      participantSchedules,
      validatedData.durationMinutes || 60,
      validatedData.preferredDates || [],
      validatedData.meetingPurpose || "general discussion",
      validatedData.allowRecurring || false,
      validatedData.existingMeetingId
    );
    
    res.json(suggestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error suggesting meeting time:", error);
    res.status(500).json({ message: "Failed to suggest meeting time" });
  }
}

// Detect and resolve meeting conflicts
export async function detectMeetingConflicts(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const requestSchema = z.object({
      meetingId: z.number(),
      newStartTime: z.string().optional(),
      newEndTime: z.string().optional()
    });
    
    const validatedData = requestSchema.parse(req.body);
    
    // Get the meeting and its participants
    const meeting = await storage.getMeetingById(validatedData.meetingId);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    
    const participants = await storage.getMeetingParticipants(validatedData.meetingId);
    
    // Use new start/end times if provided, otherwise use the existing meeting times
    const startTime = validatedData.newStartTime 
      ? new Date(validatedData.newStartTime) 
      : meeting.startTime;
    
    const endTime = validatedData.newEndTime 
      ? new Date(validatedData.newEndTime) 
      : meeting.endTime;
    
    // Check for conflicts for each participant
    const conflicts = await Promise.all(
      participants.map(async (participant) => {
        if (!participant.id) return null;
        
        // Get participant events
        const events = await storage.getUserEvents(participant.id);
        const meetings = await storage.getUserMeetings(participant.id);
        
        // Filter out the current meeting from the meetings list
        const otherMeetings = meetings.filter(m => m.id !== validatedData.meetingId);
        
        // Combine events and other meetings
        const allEvents = [
          ...events,
          ...otherMeetings
        ];
        
        // Check for conflicts
        const conflicts = allEvents.filter(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          
          // Check if there's an overlap
          return (
            (startTime >= eventStart && startTime < eventEnd) || // Start time is during another event
            (endTime > eventStart && endTime <= eventEnd) || // End time is during another event
            (startTime <= eventStart && endTime >= eventEnd) // This meeting encompasses another event
          );
        });
        
        if (conflicts.length > 0) {
          return {
            userId: participant.id,
            name: participant.name,
            conflicts: conflicts.map(c => ({
              title: c.title,
              startTime: c.startTime,
              endTime: c.endTime,
              type: "events" in c ? "event" : "meeting"
            }))
          };
        }
        
        return null;
      })
    );
    
    // Filter out null values and return only participants with conflicts
    const conflictingParticipants = conflicts.filter(c => c !== null);
    
    // Generate suggestions for resolving conflicts
    let resolutionSuggestion = "";
    if (conflictingParticipants.length > 0) {
      const requiredParticipantsWithConflicts = conflictingParticipants.filter(
        cp => participants.find(p => p.id === cp?.userId)?.requiredAttendance
      );
      
      if (requiredParticipantsWithConflicts.length > 0) {
        resolutionSuggestion = "Consider rescheduling as required participants have conflicts.";
      } else {
        resolutionSuggestion = "Optional participants have conflicts. You may proceed or consider an alternative time.";
      }
    }
    
    res.json({
      hasConflicts: conflictingParticipants.length > 0,
      conflictingParticipants,
      resolutionSuggestion,
      totalParticipants: participants.length,
      conflictingParticipantsCount: conflictingParticipants.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error detecting meeting conflicts:", error);
    res.status(500).json({ message: "Failed to detect meeting conflicts" });
  }
}
