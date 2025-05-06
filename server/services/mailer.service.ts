import nodemailer from "nodemailer";
import { format } from "date-fns";

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
});

// Email sender address
const fromEmail = process.env.EMAIL_FROM || "trainnet@example.com";

// Validate SMTP configuration
export async function validateSMTPConfig(): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP configuration is incomplete. Email notifications will not be sent.");
    return false;
  }
  
  try {
    await transporter.verify();
    console.log("SMTP connection verified");
    return true;
  } catch (error) {
    console.error("SMTP connection failed:", error);
    return false;
  }
}

// Send meeting invitation
export async function sendMeetingInvitation(
  to: string,
  subject: string,
  startTime: Date,
  endTime: Date,
  location: string,
  organizer: string
): Promise<boolean> {
  try {
    // Validate SMTP config
    const isValid = await validateSMTPConfig();
    if (!isValid) return false;
    
    // Format dates for display
    const formattedDate = format(startTime, "EEEE, MMMM d, yyyy");
    const formattedStartTime = format(startTime, "h:mm a");
    const formattedEndTime = format(endTime, "h:mm a");
    
    // Generate calendar invite (iCalendar format)
    const icalContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TrainNET//Meeting//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@trainnet.example.com
DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}
DTSTART:${format(startTime, "yyyyMMdd'T'HHmmss'Z'")}
DTEND:${format(endTime, "yyyyMMdd'T'HHmmss'Z'")}
SUMMARY:${subject}
LOCATION:${location}
ORGANIZER;CN=${organizer}:mailto:${fromEmail}
DESCRIPTION:You have been invited to a meeting: ${subject}.\n\nOrganizer: ${organizer}\nLocation: ${location}\nDate: ${formattedDate}\nTime: ${formattedStartTime} - ${formattedEndTime}
END:VEVENT
END:VCALENDAR
    `.trim();
    
    // Send email with calendar attachment
    const mailOptions = {
      from: `"TrainNET" <${fromEmail}>`,
      to,
      subject: `Meeting Invitation: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0078d4; padding: 20px; color: white;">
            <h2 style="margin: 0;">Meeting Invitation</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>You have been invited to the following meeting:</p>
            <h3 style="color: #0078d4;">${subject}</h3>
            <p><strong>Organizer:</strong> ${organizer}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p>Please respond to this invitation to confirm your attendance.</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #0078d4; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px;">Accept</a>
              <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #d83b01; color: white; text-decoration: none; border-radius: 4px;">Decline</a>
            </div>
          </div>
          <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message from the TrainNET system.</p>
          </div>
        </div>
      `,
      icalEvent: {
        filename: 'invitation.ics',
        method: 'REQUEST',
        content: icalContent
      }
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending meeting invitation:", error);
    return false;
  }
}

// Send notification about new training program
export async function sendNewTrainingNotification(
  to: string,
  programName: string,
  programDescription: string,
  startDate: Date,
  duration: string
): Promise<boolean> {
  try {
    // Validate SMTP config
    const isValid = await validateSMTPConfig();
    if (!isValid) return false;
    
    // Format date for display
    const formattedStartDate = format(startDate, "MMMM d, yyyy");
    
    // Send email
    const mailOptions = {
      from: `"TrainNET" <${fromEmail}>`,
      to,
      subject: `New Training Program: ${programName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0078d4; padding: 20px; color: white;">
            <h2 style="margin: 0;">New Training Program Available</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h3 style="color: #0078d4;">${programName}</h3>
            <p>${programDescription}</p>
            <p><strong>Start Date:</strong> ${formattedStartDate}</p>
            <p><strong>Duration:</strong> ${duration}</p>
            <p>This program matches your skill set and may be of interest to you.</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #0078d4; color: white; text-decoration: none; border-radius: 4px;">View Program Details</a>
            </div>
          </div>
          <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message from the TrainNET system.</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending training notification:", error);
    return false;
  }
}

// Send program enrollment notification to trainee
export async function sendProgramEnrollmentNotification(
  to: string,
  traineeName: string,
  programName: string,
  programCode: string,
  startDate: Date,
  duration: string,
  location: string,
  trainerName: string
): Promise<boolean> {
  try {
    // Validate SMTP config
    const isValid = await validateSMTPConfig();
    if (!isValid) return false;
    
    // Format date for display
    const formattedStartDate = format(startDate, "MMMM d, yyyy");
    
    // Send email
    const mailOptions = {
      from: `"TrainNET" <${fromEmail}>`,
      to,
      subject: `Enrollment Confirmation: ${programName} (${programCode})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0078d4; padding: 20px; color: white;">
            <h2 style="margin: 0;">Training Enrollment Confirmation</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>Dear ${traineeName},</p>
            <p>You have been enrolled in the following training program:</p>
            <h3 style="color: #0078d4;">${programName} (${programCode})</h3>
            <p><strong>Start Date:</strong> ${formattedStartDate}</p>
            <p><strong>Duration:</strong> ${duration}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Trainer:</strong> ${trainerName}</p>
            <p>Please review the program details and ensure you meet all prerequisites before the start date.</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #0078d4; color: white; text-decoration: none; border-radius: 4px;">View Program Details</a>
            </div>
          </div>
          <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message from the TrainNET system.</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending program enrollment notification:", error);
    return false;
  }
}

// Send trainer assignment notification
export async function sendTrainerAssignmentNotification(
  to: string,
  trainerName: string,
  programName: string,
  programCode: string,
  startDate: Date,
  duration: string,
  location: string,
  enrollmentCount: number
): Promise<boolean> {
  try {
    // Validate SMTP config
    const isValid = await validateSMTPConfig();
    if (!isValid) return false;
    
    // Format date for display
    const formattedStartDate = format(startDate, "MMMM d, yyyy");
    
    // Send email
    const mailOptions = {
      from: `"TrainNET" <${fromEmail}>`,
      to,
      subject: `Trainer Assignment: ${programName} (${programCode})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0078d4; padding: 20px; color: white;">
            <h2 style="margin: 0;">Trainer Assignment</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>Dear ${trainerName},</p>
            <p>You have been assigned as the trainer for the following program:</p>
            <h3 style="color: #0078d4;">${programName} (${programCode})</h3>
            <p><strong>Start Date:</strong> ${formattedStartDate}</p>
            <p><strong>Duration:</strong> ${duration}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Current Enrollment:</strong> ${enrollmentCount} trainees</p>
            <p>Please review the program details and prepare the necessary materials. You can access the trainee list and manage the program from your dashboard.</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #0078d4; color: white; text-decoration: none; border-radius: 4px;">Manage Program</a>
            </div>
          </div>
          <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message from the TrainNET system.</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending trainer assignment notification:", error);
    return false;
  }
}

// Send certificate notification
export async function sendCertificateNotification(
  to: string,
  recipientName: string,
  programName: string,
  issueDate: Date,
  certificateNumber: string
): Promise<boolean> {
  try {
    // Validate SMTP config
    const isValid = await validateSMTPConfig();
    if (!isValid) return false;
    
    // Format date for display
    const formattedIssueDate = format(issueDate, "MMMM d, yyyy");
    
    // Send email
    const mailOptions = {
      from: `"TrainNET" <${fromEmail}>`,
      to,
      subject: `Certificate Issued: ${programName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0078d4; padding: 20px; color: white;">
            <h2 style="margin: 0;">Certificate Issued</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>Congratulations ${recipientName}!</p>
            <p>You have been issued a certificate for completing the following program:</p>
            <h3 style="color: #0078d4;">${programName}</h3>
            <p><strong>Issue Date:</strong> ${formattedIssueDate}</p>
            <p><strong>Certificate Number:</strong> ${certificateNumber}</p>
            <p>You can download your certificate from your profile page.</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #0078d4; color: white; text-decoration: none; border-radius: 4px;">View Certificate</a>
            </div>
          </div>
          <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message from the TrainNET system.</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending certificate notification:", error);
    return false;
  }
}
