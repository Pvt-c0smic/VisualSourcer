import { db } from "@db";
import { eq, gt, count, and, sql, or, desc, not, isNull } from "drizzle-orm";
import { 
  users, programs, certificates, meetings, events,
  programEnrollments, certificateTemplates, meetingParticipants,
  eventParticipants
} from "@shared/schema";

export const storage = {
  // Dashboard stats functions
  getActiveTrainees: async (): Promise<number> => {
    const result = await db.select({ count: count() })
      .from(users)
      .where(eq(users.role, 'trainee'));
    return result[0]?.count || 0;
  },
  
  getActivePrograms: async (): Promise<number> => {
    const result = await db.select({ count: count() })
      .from(programs)
      .where(eq(programs.status, 'Open'));
    return result[0]?.count || 0;
  },

  getCertificatesCount: async (): Promise<number> => {
    const result = await db.select({ count: count() })
      .from(certificates);
    return result[0]?.count || 0;
  },

  getUpcomingMeetingsCount: async (): Promise<number> => {
    const currentDate = new Date();
    const result = await db.select({ count: count() })
      .from(meetings)
      .where(gt(meetings.startTime, currentDate));
    return result[0]?.count || 0;
  },

  // User functions
  getUserById: async (userId: number) => {
    return await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
  },
  
  getUserByUsername: async (username: string) => {
    return await db.query.users.findFirst({
      where: eq(users.username, username)
    });
  },
  
  getUserByEmail: async (email: string) => {
    return await db.query.users.findFirst({
      where: eq(users.email, email)
    });
  },
  
  createUser: async (userData: any) => {
    const [newUser] = await db.insert(users)
      .values(userData)
      .returning();
    return newUser;
  },
  
  updateUser: async (userId: number, updateData: any) => {
    const [updatedUser] = await db.update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  },
  
  getAllUsers: async () => {
    return await db.query.users.findMany();
  },

  // Program functions
  getProgramById: async (programId: number) => {
    return await db.query.programs.findFirst({
      where: eq(programs.id, programId)
    });
  },

  // Certificate functions
  getAllCertificates: async () => {
    return await db.query.certificates.findMany();
  },

  getUserCertificates: async (userId: number) => {
    return await db.query.certificates.findMany({
      where: eq(certificates.userId, userId)
    });
  },

  getCertificateById: async (certificateId: number) => {
    return await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId)
    });
  },

  createCertificate: async (certificateData: any) => {
    const [newCertificate] = await db.insert(certificates)
      .values(certificateData)
      .returning();
    return newCertificate;
  },

  updateCertificate: async (certificateId: number, updateData: any) => {
    const [updatedCertificate] = await db.update(certificates)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(certificates.id, certificateId))
      .returning();
    return updatedCertificate;
  },

  deleteCertificate: async (certificateId: number) => {
    await db.delete(certificates)
      .where(eq(certificates.id, certificateId));
    return true;
  },

  // Certificate template functions
  getAllCertificateTemplates: async () => {
    return await db.query.certificateTemplates.findMany();
  },

  getCertificateTemplateById: async (templateId: number) => {
    return await db.query.certificateTemplates.findFirst({
      where: eq(certificateTemplates.id, templateId)
    });
  },

  getDefaultCertificateTemplate: async () => {
    return await db.query.certificateTemplates.findFirst({
      where: eq(certificateTemplates.isDefault, true)
    });
  },

  createCertificateTemplate: async (templateData: any) => {
    const [newTemplate] = await db.insert(certificateTemplates)
      .values(templateData)
      .returning();
    return newTemplate;
  },

  unsetDefaultCertificateTemplates: async (exceptId: number) => {
    await db.update(certificateTemplates)
      .set({
        isDefault: false,
        updatedAt: new Date()
      })
      .where(and(
        eq(certificateTemplates.isDefault, true),
        eq(certificateTemplates.id, exceptId)
      ));
    return true;
  },

  // Meeting functions
  getAllMeetings: async () => {
    return await db.query.meetings.findMany({
      orderBy: desc(meetings.startTime)
    });
  },

  getUserMeetings: async (userId: number) => {
    // Get all meeting IDs where the user is a participant
    const participations = await db.query.meetingParticipants.findMany({
      where: eq(meetingParticipants.userId, userId),
      columns: {
        meetingId: true
      }
    });

    const meetingIds = participations.map(p => p.meetingId);

    // Get meetings where user is a participant or the creator
    const userMeetings = await db.query.meetings.findMany({
      where: or(
        eq(meetings.createdById, userId),
        sql`${meetings.id} IN (${meetingIds.length > 0 ? meetingIds : [0]})`
      ),
      orderBy: desc(meetings.startTime)
    });

    return userMeetings;
  },

  getMeetingById: async (meetingId: number) => {
    return await db.query.meetings.findFirst({
      where: eq(meetings.id, meetingId)
    });
  },

  getMeetingParticipants: async (meetingId: number) => {
    const participants = await db.query.meetingParticipants.findMany({
      where: eq(meetingParticipants.meetingId, meetingId)
    });

    // Get user details for each participant
    const participantDetails = await Promise.all(
      participants.map(async (participant) => {
        const user = await db.query.users.findFirst({
          where: eq(users.id, participant.userId)
        });

        return {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          rank: user?.rank,
          unit: user?.unit,
          avatarUrl: user?.avatarUrl,
          participationStatus: participant.status,
          participationRole: participant.role,
          participationId: participant.id
        };
      })
    );

    return participantDetails.filter(p => p.id !== undefined);
  },

  getMeetingParticipantByUserId: async (meetingId: number, userId: number) => {
    return await db.query.meetingParticipants.findFirst({
      where: and(
        eq(meetingParticipants.meetingId, meetingId),
        eq(meetingParticipants.userId, userId)
      )
    });
  },

  createMeeting: async (meetingData: any) => {
    const [newMeeting] = await db.insert(meetings)
      .values(meetingData)
      .returning();
    return newMeeting;
  },

  updateMeeting: async (meetingId: number, updateData: any) => {
    const [updatedMeeting] = await db.update(meetings)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(meetings.id, meetingId))
      .returning();
    return updatedMeeting;
  },

  deleteMeeting: async (meetingId: number) => {
    // Delete all participants first
    await db.delete(meetingParticipants)
      .where(eq(meetingParticipants.meetingId, meetingId));
    
    // Then delete the meeting
    await db.delete(meetings)
      .where(eq(meetings.id, meetingId));
    return true;
  },

  addMeetingParticipant: async (meetingId: number, userId: number, role: string) => {
    // Check if participant already exists
    const existingParticipant = await db.query.meetingParticipants.findFirst({
      where: and(
        eq(meetingParticipants.meetingId, meetingId),
        eq(meetingParticipants.userId, userId)
      )
    });

    if (existingParticipant) {
      // Update the role if it changed
      if (existingParticipant.role !== role) {
        const [updatedParticipant] = await db.update(meetingParticipants)
          .set({
            role,
            updatedAt: new Date()
          })
          .where(eq(meetingParticipants.id, existingParticipant.id))
          .returning();
        return updatedParticipant;
      }
      return existingParticipant;
    }

    // Create new participant
    const [newParticipant] = await db.insert(meetingParticipants)
      .values({
        meetingId,
        userId,
        role,
        status: role === 'Organizer' ? 'Confirmed' : 'Pending',
      })
      .returning();
    return newParticipant;
  },

  updateMeetingParticipantStatus: async (participantId: number, status: string) => {
    const [updatedParticipant] = await db.update(meetingParticipants)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(meetingParticipants.id, participantId))
      .returning();
    return updatedParticipant;
  },

  removeAllMeetingParticipants: async (meetingId: number, roles: string[] = []) => {
    if (roles.length > 0) {
      // Remove only participants with specified roles
      await db.delete(meetingParticipants)
        .where(and(
          eq(meetingParticipants.meetingId, meetingId),
          sql`${meetingParticipants.role} IN (${roles})`
        ));
    } else {
      // Remove all participants
      await db.delete(meetingParticipants)
        .where(eq(meetingParticipants.meetingId, meetingId));
    }
    return true;
  },

  // Event functions
  getAllEvents: async () => {
    return await db.query.events.findMany({
      orderBy: desc(events.startTime)
    });
  },

  getUserEvents: async (userId: number) => {
    // Get all event IDs where the user is a participant
    const participations = await db.query.eventParticipants.findMany({
      where: eq(eventParticipants.userId, userId),
      columns: {
        eventId: true
      }
    });

    const eventIds = participations.map(p => p.eventId);

    // Get events where user is a participant or the creator
    const userEvents = await db.query.events.findMany({
      where: or(
        eq(events.createdById, userId),
        sql`${events.id} IN (${eventIds.length > 0 ? eventIds : [0]})`
      ),
      orderBy: desc(events.startTime)
    });

    return userEvents;
  },

  getEventById: async (eventId: number) => {
    return await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });
  },

  createEvent: async (eventData: any) => {
    const [newEvent] = await db.insert(events)
      .values(eventData)
      .returning();
    return newEvent;
  },

  updateEvent: async (eventId: number, updateData: any) => {
    const [updatedEvent] = await db.update(events)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId))
      .returning();
    return updatedEvent;
  },

  deleteEvent: async (eventId: number) => {
    // Delete all participants first
    await db.delete(eventParticipants)
      .where(eq(eventParticipants.eventId, eventId));
    
    // Then delete the event
    await db.delete(events)
      .where(eq(events.id, eventId));
    return true;
  }
};