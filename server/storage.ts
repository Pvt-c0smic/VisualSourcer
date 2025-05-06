import { db } from "@db";
import { eq, gt, count, and } from "drizzle-orm";
import { 
  users, programs, certificates, meetings,
  programEnrollments, certificateTemplates
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
  }
};