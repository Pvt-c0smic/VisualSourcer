import { pgTable, text, serial, integer, boolean, timestamp, date, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("trainee"), // admin, trainer, trainee, training_director
  rank: text("rank"),
  unit: text("unit"),
  avatarUrl: text("avatar_url"),
  skillSets: jsonb("skill_sets").default([]), // Array of skill sets
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  programEnrollments: many(programEnrollments),
  certificates: many(certificates),
  meetingParticipants: many(meetingParticipants),
}));

// Skill Sets Table
export const skillSets = pgTable("skill_sets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  level: integer("level").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const skillSetsRelations = relations(skillSets, ({ many }) => ({
  programs: many(programs),
}));

// Programs Table
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  skillSetId: integer("skill_set_id").references(() => skillSets.id).notNull(),
  skillSetLevel: integer("skill_set_level").notNull(),
  startDate: date("start_date").notNull(),
  duration: text("duration").notNull(),
  capacity: integer("capacity").notNull(),
  venue: text("venue").notNull(), // VTC or Face-to-Face
  location: text("location"),
  objectives: jsonb("objectives").default([]), // Array of objectives
  prerequisites: jsonb("prerequisites").default([]), // Array of prerequisites
  status: text("status").notNull().default("Open"), // Open, Full, Completed
  passingScore: integer("passing_score").default(70),
  certificateTitle: text("certificate_title"),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const programsRelations = relations(programs, ({ one, many }) => ({
  skillSet: one(skillSets, {
    fields: [programs.skillSetId],
    references: [skillSets.id],
  }),
  creator: one(users, {
    fields: [programs.createdById],
    references: [users.id],
  }),
  enrollments: many(programEnrollments),
  modules: many(programModules),
}));

// Program Modules Table
export const programModules = pgTable("program_modules", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  type: text("type").notNull().default("lecture"), // lecture, quiz, assignment, resource
  order: integer("order").notNull(),
  estimatedDuration: text("estimated_duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const programModulesRelations = relations(programModules, ({ one }) => ({
  program: one(programs, {
    fields: [programModules.programId],
    references: [programs.id],
  }),
}));

// Program Enrollments Table
export const programEnrollments = pgTable("program_enrollments", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  status: text("status").notNull().default("Active"), // Active, Completed, Dropped
  progress: integer("progress").default(0), // 0-100 percentage
  completionDate: timestamp("completion_date"),
  finalScore: integer("final_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const programEnrollmentsRelations = relations(programEnrollments, ({ one }) => ({
  program: one(programs, {
    fields: [programEnrollments.programId],
    references: [programs.id],
  }),
  user: one(users, {
    fields: [programEnrollments.userId],
    references: [users.id],
  }),
}));

// Certificates Table
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  programId: integer("program_id").references(() => programs.id).notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"),
  certificateNumber: text("certificate_number").notNull().unique(),
  status: text("status").notNull().default("Active"), // Active, Expired, Revoked
  fileUrl: text("file_url"),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id],
  }),
  program: one(programs, {
    fields: [certificates.programId],
    references: [programs.id],
  }),
  creator: one(users, {
    fields: [certificates.createdById],
    references: [users.id],
  }),
}));

// Certificate Templates Table
export const certificateTemplates = pgTable("certificate_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  htmlTemplate: text("html_template").notNull(),
  isDefault: boolean("is_default").default(false),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certificateTemplatesRelations = relations(certificateTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [certificateTemplates.createdById],
    references: [users.id],
  }),
}));

// Events Table (for Calendar)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  type: text("type").notNull(), // training, meeting, ceremony, workshop
  venueType: text("venue_type"), // VTC, Face-to-Face
  required: boolean("required").default(false),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  participants: many(eventParticipants),
}));

// Event Participants Table
export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("Pending"), // Pending, Confirmed, Declined
  notified: boolean("notified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventParticipants.userId],
    references: [users.id],
  }),
}));

// Meetings Table
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  type: text("type").notNull(), // VTC, Face-to-Face
  status: text("status").notNull().default("Scheduled"), // Scheduled, Completed, Cancelled, Pending
  agenda: jsonb("agenda").default([]), // Array of agenda items
  notes: text("notes"),
  tags: jsonb("tags").default([]), // Array of tags for categorizing meetings
  priority: text("priority").default("Normal"), // High, Normal, Low
  recurrence: text("recurrence"), // None, Daily, Weekly, Monthly
  requiredAttendance: boolean("required_attendance").default(false), // Is attendance mandatory
  privateNotes: text("private_notes"), // Notes visible only to organizer
  externalStakeholders: jsonb("external_stakeholders").default([]), // External people to invite
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  eventId: integer("event_id").references(() => events.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  creator: one(users, {
    fields: [meetings.createdById],
    references: [users.id],
  }),
  event: one(events, {
    fields: [meetings.eventId],
    references: [events.id],
  }),
  participants: many(meetingParticipants),
}));

// Meeting Participants Table
export const meetingParticipants = pgTable("meeting_participants", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetings.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("Attendee"), // Organizer, Attendee, Presenter, Stakeholder, Observer, Subject Matter Expert, Trainee, Trainer, Optional
  stakeholderType: text("stakeholder_type"), // Internal, External, Military, Civilian, Contractor, etc.
  status: text("status").notNull().default("Pending"), // Pending, Confirmed, Declined
  responseMessage: text("response_message"), // Optional message when responding
  notified: boolean("notified").default(false),
  attendance: text("attendance"), // Present, Absent, Excused, Late
  requiredAttendance: boolean("required_attendance").default(true), // Is this person required to attend
  contributionNotes: text("contribution_notes"), // Notes about participant's contributions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const meetingParticipantsRelations = relations(meetingParticipants, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingParticipants.meetingId],
    references: [meetings.id],
  }),
  user: one(users, {
    fields: [meetingParticipants.userId],
    references: [users.id],
  }),
}));

// Quizzes Table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => programModules.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  timeLimit: integer("time_limit"), // in minutes
  passingScore: integer("passing_score").default(70), // percentage
  randomizeQuestions: boolean("randomize_questions").default(false),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  module: one(programModules, {
    fields: [quizzes.moduleId],
    references: [programModules.id],
  }),
  creator: one(users, {
    fields: [quizzes.createdById],
    references: [users.id],
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

// Quiz Questions Table
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // multiple-choice, true-false, short-answer, essay
  options: jsonb("options").default([]), // Array of options for multiple-choice questions
  correctAnswer: text("correct_answer"), // For objective questions
  points: integer("points").default(1),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizQuestionsRelations = relations(quizQuestions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  responses: many(quizResponses),
}));

// Quiz Attempts Table
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  score: integer("score"),
  maxPossibleScore: integer("max_possible_score"),
  percentageScore: decimal("percentage_score", { precision: 5, scale: 2 }),
  passed: boolean("passed"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewDate: timestamp("review_date"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [quizAttempts.reviewedBy],
    references: [users.id],
  }),
  responses: many(quizResponses),
}));

// Quiz Responses Table
export const quizResponses = pgTable("quiz_responses", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => quizAttempts.id).notNull(),
  questionId: integer("question_id").references(() => quizQuestions.id).notNull(),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  points: integer("points").default(0),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizResponsesRelations = relations(quizResponses, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizResponses.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(quizQuestions, {
    fields: [quizResponses.questionId],
    references: [quizQuestions.id],
  }),
}));

// Lectures Table
export const lectures = pgTable("lectures", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => programModules.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments").default([]), // Array of attachment URLs
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lecturesRelations = relations(lectures, ({ one }) => ({
  module: one(programModules, {
    fields: [lectures.moduleId],
    references: [programModules.id],
  }),
  creator: one(users, {
    fields: [lectures.createdById],
    references: [users.id],
  }),
}));

// Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, warning, success, error
  read: boolean("read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Please provide a valid email"),
  role: (schema) => schema.refine((val) => ['admin', 'trainer', 'trainee', 'training_director'].includes(val), {
    message: "Role must be one of: admin, trainer, trainee, training_director"
  }),
});

export const insertProgramSchema = createInsertSchema(programs, {
  name: (schema) => schema.min(3, "Name must be at least 3 characters"),
  code: (schema) => schema.min(2, "Code must be at least 2 characters"),
  capacity: (schema) => schema.min(1, "Capacity must be at least 1"),
  venue: (schema) => schema.refine((val) => ['VTC', 'Face-to-Face'].includes(val), {
    message: "Venue must be either VTC or Face-to-Face"
  }),
  status: (schema) => schema.refine((val) => ['Open', 'Full', 'Completed'].includes(val), {
    message: "Status must be one of: Open, Full, Completed"
  }),
});

export const insertMeetingSchema = createInsertSchema(meetings, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  type: (schema) => schema.refine((val) => ['VTC', 'Face-to-Face'].includes(val), {
    message: "Type must be either VTC or Face-to-Face"
  }),
  status: (schema) => schema.refine((val) => ['Scheduled', 'Completed', 'Cancelled', 'Pending'].includes(val), {
    message: "Status must be one of: Scheduled, Completed, Cancelled, Pending"
  }),
});

export const insertCertificateSchema = createInsertSchema(certificates, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  certificateNumber: (schema) => schema.min(3, "Certificate number must be at least 3 characters"),
  status: (schema) => schema.refine((val) => ['Active', 'Expired', 'Revoked'].includes(val), {
    message: "Status must be one of: Active, Expired, Revoked"
  }),
});

export const insertEventSchema = createInsertSchema(events, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  type: (schema) => schema.refine((val) => ['training', 'meeting', 'ceremony', 'workshop'].includes(val), {
    message: "Type must be one of: training, meeting, ceremony, workshop"
  }),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
