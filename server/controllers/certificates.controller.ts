import { Request, Response } from "express";
import { db } from "@db";
import { storage } from "../storage";
import { certificates, insertCertificateSchema, certificateTemplates } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateCertificate } from "../services/pdf.service";
import path from "path";
import fs from "fs";

// Get all certificates
export async function getCertificates(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    
    let allCertificates;
    
    // Admins and trainers can see all certificates
    if (user.role === 'admin' || user.role === 'trainer') {
      allCertificates = await storage.getAllCertificates();
    } else {
      // Trainees can only see their own certificates
      allCertificates = await storage.getUserCertificates(user.id);
    }
    
    // Enrich with user and program information
    const enrichedCertificates = await Promise.all(
      allCertificates.map(async (certificate) => {
        const recipient = await storage.getUserById(certificate.userId);
        const program = await storage.getProgramById(certificate.programId);
        
        return {
          ...certificate,
          recipient: recipient ? recipient.name : "Unknown User",
          program: program ? program.name : "Unknown Program",
        };
      })
    );
    
    res.json(enrichedCertificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ message: "Failed to fetch certificates" });
  }
}

// Get certificate by ID
export async function getCertificateById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const certificateId = parseInt(id, 10);
    
    if (isNaN(certificateId)) {
      return res.status(400).json({ message: "Invalid certificate ID" });
    }
    
    const certificate = await storage.getCertificateById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    // Check if user has permission to view this certificate
    const user = req.user as any;
    if (user.role !== 'admin' && user.role !== 'trainer' && certificate.userId !== user.id) {
      return res.status(403).json({ message: "You don't have permission to view this certificate" });
    }
    
    // Get recipient and program information
    const recipient = await storage.getUserById(certificate.userId);
    const program = await storage.getProgramById(certificate.programId);
    
    res.json({
      ...certificate,
      recipient: recipient ? recipient.name : "Unknown User",
      program: program ? program.name : "Unknown Program",
    });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({ message: "Failed to fetch certificate" });
  }
}

// Create a new certificate
export async function createCertificate(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Check if user is an admin or trainer
    const user = req.user as any;
    if (user.role !== 'admin' && user.role !== 'trainer') {
      return res.status(403).json({ message: "Only admin or trainer can create certificates" });
    }
    
    // Validate request body
    const validatedData = insertCertificateSchema.parse(req.body);
    
    // Verify the user exists
    const certUser = await storage.getUserById(validatedData.userId);
    if (!certUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Verify the program exists
    const program = await storage.getProgramById(validatedData.programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    // Generate a unique certificate number if not provided
    if (!validatedData.certificateNumber) {
      const timestamp = new Date().getTime().toString();
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      validatedData.certificateNumber = `CERT-${timestamp.slice(-6)}-${randomPart}`;
    }
    
    // Generate certificate PDF
    const templateId = req.body.templateId || null;
    let template = null;
    
    if (templateId) {
      template = await storage.getCertificateTemplateById(templateId);
    } else {
      // Get default template
      template = await storage.getDefaultCertificateTemplate();
    }
    
    if (!template) {
      return res.status(404).json({ message: "Certificate template not found" });
    }
    
    // Generate the certificate
    const certificateFilename = `certificate_${validatedData.certificateNumber}.pdf`;
    const certificatePath = path.join(__dirname, '..', '..', 'uploads', 'certificates', certificateFilename);
    
    // Ensure directory exists
    const dir = path.dirname(certificatePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await generateCertificate({
      template: template.htmlTemplate,
      recipientName: certUser.name,
      programName: program.name,
      certificateNumber: validatedData.certificateNumber,
      issueDate: new Date().toISOString(),
      expiryDate: validatedData.expiryDate || null,
      outputPath: certificatePath,
    });
    
    // Create certificate in database
    const newCertificate = await storage.createCertificate({
      ...validatedData,
      title: validatedData.title || `${program.name} Certificate`,
      issueDate: new Date(),
      fileUrl: `/api/certificates/${certificateFilename}`,
      createdById: user.id,
    });
    
    res.status(201).json({
      ...newCertificate,
      recipient: certUser.name,
      program: program.name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error creating certificate:", error);
    res.status(500).json({ message: "Failed to create certificate" });
  }
}

// Update a certificate
export async function updateCertificate(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const certificateId = parseInt(id, 10);
    
    if (isNaN(certificateId)) {
      return res.status(400).json({ message: "Invalid certificate ID" });
    }
    
    const certificate = await storage.getCertificateById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    // Check if user has permission to update this certificate
    const user = req.user as any;
    if (user.role !== 'admin' && certificate.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to update this certificate" });
    }
    
    // Validate request body
    const updateCertificateSchema = z.object({
      title: z.string().min(3).optional(),
      status: z.enum(["Active", "Expired", "Revoked"]).optional(),
      expiryDate: z.string().optional().nullable(),
    });
    
    const validatedData = updateCertificateSchema.parse(req.body);
    
    // Update certificate
    const updatedCertificate = await storage.updateCertificate(certificateId, validatedData);
    
    // Get recipient and program information
    const recipient = await storage.getUserById(certificate.userId);
    const program = await storage.getProgramById(certificate.programId);
    
    res.json({
      ...updatedCertificate,
      recipient: recipient ? recipient.name : "Unknown User",
      program: program ? program.name : "Unknown Program",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating certificate:", error);
    res.status(500).json({ message: "Failed to update certificate" });
  }
}

// Delete a certificate
export async function deleteCertificate(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { id } = req.params;
    const certificateId = parseInt(id, 10);
    
    if (isNaN(certificateId)) {
      return res.status(400).json({ message: "Invalid certificate ID" });
    }
    
    const certificate = await storage.getCertificateById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    // Check if user has permission to delete this certificate
    const user = req.user as any;
    if (user.role !== 'admin' && certificate.createdById !== user.id) {
      return res.status(403).json({ message: "You don't have permission to delete this certificate" });
    }
    
    // Delete certificate
    await storage.deleteCertificate(certificateId);
    
    // Also delete the file if it exists
    if (certificate.fileUrl) {
      const filename = certificate.fileUrl.split('/').pop();
      if (filename) {
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'certificates', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    
    res.json({ message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({ message: "Failed to delete certificate" });
  }
}

// Download a certificate
export async function downloadCertificate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const certificateId = parseInt(id, 10);
    
    if (isNaN(certificateId)) {
      return res.status(400).json({ message: "Invalid certificate ID" });
    }
    
    const certificate = await storage.getCertificateById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    // Check if user has permission to download this certificate
    const user = req.user as any;
    if (user.role !== 'admin' && user.role !== 'trainer' && certificate.userId !== user.id) {
      return res.status(403).json({ message: "You don't have permission to download this certificate" });
    }
    
    // Check if file exists
    if (!certificate.fileUrl) {
      return res.status(404).json({ message: "Certificate file not found" });
    }
    
    const filename = certificate.fileUrl.split('/').pop();
    if (!filename) {
      return res.status(404).json({ message: "Certificate file not found" });
    }
    
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'certificates', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Certificate file not found" });
    }
    
    // Get recipient and program information for the filename
    const recipient = await storage.getUserById(certificate.userId);
    const program = await storage.getProgramById(certificate.programId);
    
    const downloadFilename = `${program ? program.name : 'Certificate'}_${recipient ? recipient.name : 'User'}.pdf`.replace(/\s+/g, '_');
    
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading certificate:", error);
    res.status(500).json({ message: "Failed to download certificate" });
  }
}

// Get certificate templates
export async function getCertificateTemplates(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Check if user is an admin or trainer
    const user = req.user as any;
    if (user.role !== 'admin' && user.role !== 'trainer') {
      return res.status(403).json({ message: "Only admin or trainer can access certificate templates" });
    }
    
    const templates = await storage.getAllCertificateTemplates();
    
    res.json(templates);
  } catch (error) {
    console.error("Error fetching certificate templates:", error);
    res.status(500).json({ message: "Failed to fetch certificate templates" });
  }
}

// Create a certificate template
export async function createCertificateTemplate(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Check if user is an admin or trainer
    const user = req.user as any;
    if (user.role !== 'admin' && user.role !== 'trainer') {
      return res.status(403).json({ message: "Only admin or trainer can create certificate templates" });
    }
    
    const templateSchema = z.object({
      name: z.string().min(3, "Name must be at least 3 characters"),
      description: z.string().optional(),
      htmlTemplate: z.string().min(10, "HTML template must be at least 10 characters"),
      isDefault: z.boolean().optional(),
    });
    
    const validatedData = templateSchema.parse(req.body);
    
    // Create template
    const newTemplate = await storage.createCertificateTemplate({
      ...validatedData,
      createdById: user.id,
    });
    
    // If this is set as default, unset previous default
    if (validatedData.isDefault) {
      await storage.unsetDefaultCertificateTemplates(newTemplate.id);
    }
    
    res.status(201).json(newTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error creating certificate template:", error);
    res.status(500).json({ message: "Failed to create certificate template" });
  }
}
