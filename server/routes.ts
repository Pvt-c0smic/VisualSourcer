import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@db";
import passport from "passport";
import { db } from "@db";

// Controllers
import * as authController from "./controllers/auth.controller";
import * as programsController from "./controllers/programs.controller";
import * as meetingsController from "./controllers/meetings.controller";
import * as certificatesController from "./controllers/certificates.controller";
import * as schedulesController from "./controllers/schedules.controller";
import * as usersController from "./controllers/users.controller";
import * as skillsetsController from "./controllers/skillsets.controller";
import * as analyticsController from "./controllers/analytics.controller";

// Middleware
import { isAuthenticated, isAdmin, isTrainer } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session store
  const PgSession = connectPgSimple(session);
  
  // Configure session middleware
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "dev-secret-1234",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Initialize Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  authController.configurePassport(passport);

  // API Routes
  const apiRouter = express.Router();
  
  // Auth routes
  apiRouter.post("/auth/login", authController.login);
  apiRouter.post("/auth/logout", authController.logout);
  apiRouter.post("/auth/register", authController.register);
  apiRouter.get("/auth/me", authController.getCurrentUser);

  // User routes
  apiRouter.get("/users", isAuthenticated, usersController.getUsers);
  apiRouter.get("/users/:id", isAuthenticated, usersController.getUserById);
  apiRouter.post("/users", isAdmin, usersController.createUser);
  apiRouter.put("/users/:id", isAuthenticated, usersController.updateUser);
  apiRouter.delete("/users/:id", isAdmin, usersController.deleteUser);
  
  // Program routes
  apiRouter.get("/programs", isAuthenticated, programsController.getPrograms);
  apiRouter.get("/programs/:id", isAuthenticated, programsController.getProgramById);
  apiRouter.post("/programs", isTrainer, programsController.createProgram);
  apiRouter.put("/programs/:id", isTrainer, programsController.updateProgram);
  apiRouter.delete("/programs/:id", isTrainer, programsController.deleteProgram);
  apiRouter.get("/programs/:id/enrollees", isAuthenticated, programsController.getProgramEnrollees);
  apiRouter.post("/programs/:id/enroll", isAuthenticated, programsController.enrollInProgram);
  apiRouter.post("/programs/:id/unenroll", isAuthenticated, programsController.unenrollFromProgram);
  apiRouter.post("/programs/:id/complete", isTrainer, programsController.completeProgram);

  // Meeting routes
  apiRouter.get("/meetings", isAuthenticated, meetingsController.getMeetings);
  apiRouter.get("/meetings/:id", isAuthenticated, meetingsController.getMeetingById);
  apiRouter.post("/meetings", isAuthenticated, meetingsController.createMeeting);
  apiRouter.put("/meetings/:id", isAuthenticated, meetingsController.updateMeeting);
  apiRouter.delete("/meetings/:id", isAuthenticated, meetingsController.deleteMeeting);
  apiRouter.post("/meetings/:id/respond", isAuthenticated, meetingsController.respondToMeeting);
  apiRouter.put("/meetings/:meetingId/participants/:participantId", isAuthenticated, meetingsController.updateMeetingParticipant);
  apiRouter.post("/meetings/suggest-time", isAuthenticated, meetingsController.suggestMeetingTime);

  // Certificate routes
  apiRouter.get("/certificates", isAuthenticated, certificatesController.getCertificates);
  apiRouter.get("/certificates/:id", isAuthenticated, certificatesController.getCertificateById);
  apiRouter.post("/certificates", isTrainer, certificatesController.createCertificate);
  apiRouter.put("/certificates/:id", isTrainer, certificatesController.updateCertificate);
  apiRouter.delete("/certificates/:id", isTrainer, certificatesController.deleteCertificate);
  apiRouter.get("/certificates/:id/download", isAuthenticated, certificatesController.downloadCertificate);
  apiRouter.get("/certificate-templates", isTrainer, certificatesController.getCertificateTemplates);
  apiRouter.post("/certificate-templates", isTrainer, certificatesController.createCertificateTemplate);

  // Schedule & Events routes
  apiRouter.get("/events", isAuthenticated, schedulesController.getEvents);
  apiRouter.post("/events", isAuthenticated, schedulesController.createEvent);
  apiRouter.put("/events/:id", isAuthenticated, schedulesController.updateEvent);
  apiRouter.delete("/events/:id", isAuthenticated, schedulesController.deleteEvent);

  // Skill Set routes
  apiRouter.get("/skillsets", isAuthenticated, skillsetsController.getSkillSets);
  apiRouter.get("/skillsets/categories", isAuthenticated, skillsetsController.getSkillSetCategories);
  apiRouter.get("/skillsets/:id", isAuthenticated, skillsetsController.getSkillSetById);
  apiRouter.put("/users/:id/skillsets", isAuthenticated, skillsetsController.updateUserSkillSets);
  
  // Analytics routes
  apiRouter.get("/analytics/enrollment", isAuthenticated, analyticsController.getEnrollmentStats);
  apiRouter.get("/analytics/organization", isAdmin, analyticsController.getOrgAnalytics);
  apiRouter.get("/analytics/users/:userId/skill-progress", isAuthenticated, analyticsController.getSkillProgress);
  apiRouter.get("/analytics/users/:userId/skill-predictions", isAuthenticated, analyticsController.getSkillPredictions);
  apiRouter.get("/analytics/users/:userId/skill-gaps", isAuthenticated, analyticsController.getSkillGapAnalysis);
  apiRouter.get("/analytics/users/:userId/recommendations", isAuthenticated, analyticsController.getPersonalizedRecommendations);

  // Dashboard routes
  apiRouter.get("/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const activeTrainees = await storage.getActiveTrainees();
      const activePrograms = await storage.getActivePrograms();
      const certificatesIssued = await storage.getCertificatesCount();
      const upcomingMeetings = await storage.getUpcomingMeetingsCount();

      res.json({
        activeTrainees,
        activePrograms,
        certificatesIssued,
        upcomingMeetings
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Attach API router to main app with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
