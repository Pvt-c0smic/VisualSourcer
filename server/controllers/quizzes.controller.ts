import { Request, Response } from "express";
import { z } from "zod";
import * as storage from "../storage";

// Get all quizzes (with filtering by module, program, creator)
export async function getQuizzes(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { moduleId, programId, createdById } = req.query;
    
    const filters: any = {};
    if (moduleId) filters.moduleId = parseInt(moduleId as string, 10);
    if (programId) filters.programId = parseInt(programId as string, 10);
    if (createdById) filters.createdById = parseInt(createdById as string, 10);

    const quizzes = await storage.getQuizzes(filters);
    res.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
}

// Get quiz by ID
export async function getQuizById(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const quizId = parseInt(req.params.id, 10);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    const quiz = await storage.getQuizById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ message: "Failed to fetch quiz" });
  }
}

// Create a new quiz
export async function createQuiz(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    
    // Check if user is a trainer
    if (user.role !== 'trainer' && user.role !== 'admin') {
      return res.status(403).json({ message: "Only trainers can create quizzes" });
    }

    const quizSchema = z.object({
      moduleId: z.number(),
      title: z.string().min(3, "Title must be at least 3 characters"),
      description: z.string().optional(),
      timeLimit: z.number().optional(),
      passingScore: z.number().min(0).max(100).optional(),
      randomizeQuestions: z.boolean().optional(),
      questions: z.array(
        z.object({
          questionText: z.string().min(1, "Question text is required"),
          questionType: z.string(),
          options: z.array(z.string()).optional(),
          correctAnswer: z.string().optional(),
          points: z.number().optional(),
          order: z.number(),
        })
      ).optional(),
    });

    const validatedData = quizSchema.parse(req.body);
    
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
      return res.status(403).json({ message: "You don't have permission to add quizzes to this program" });
    }

    // Create the quiz
    const newQuiz = await storage.createQuiz({
      ...validatedData,
      createdById: user.id,
    });

    // If questions were provided, create them as well
    if (validatedData.questions && validatedData.questions.length > 0) {
      await Promise.all(
        validatedData.questions.map(question => 
          storage.createQuizQuestion({
            ...question,
            quizId: newQuiz.id,
          })
        )
      );
      
      // Get the quiz with questions
      const quizWithQuestions = await storage.getQuizById(newQuiz.id);
      return res.status(201).json(quizWithQuestions);
    }

    res.status(201).json(newQuiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error creating quiz:", error);
    res.status(500).json({ message: "Failed to create quiz" });
  }
}

// Update a quiz
export async function updateQuiz(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const quizId = parseInt(req.params.id, 10);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    // Check if quiz exists
    const quiz = await storage.getQuizById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    // Check permissions
    if (quiz.createdById !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to update this quiz" });
    }

    const quizSchema = z.object({
      title: z.string().min(3, "Title must be at least 3 characters").optional(),
      description: z.string().optional(),
      timeLimit: z.number().optional(),
      passingScore: z.number().min(0).max(100).optional(),
      randomizeQuestions: z.boolean().optional(),
    });

    const validatedData = quizSchema.parse(req.body);
    
    // Update the quiz
    const updatedQuiz = await storage.updateQuiz(quizId, validatedData);
    
    res.json(updatedQuiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating quiz:", error);
    res.status(500).json({ message: "Failed to update quiz" });
  }
}

// Delete a quiz
export async function deleteQuiz(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const quizId = parseInt(req.params.id, 10);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    // Check if quiz exists
    const quiz = await storage.getQuizById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    // Check permissions
    if (quiz.createdById !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to delete this quiz" });
    }

    // Check if there are attempts
    const attempts = await storage.getQuizAttempts({ quizId });
    
    if (attempts.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete quiz with existing attempts. Consider archiving it instead." 
      });
    }

    // Delete the quiz
    await storage.deleteQuiz(quizId);
    
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ message: "Failed to delete quiz" });
  }
}

// Get quiz questions
export async function getQuizQuestions(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const quizId = parseInt(req.params.id, 10);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    const questions = await storage.getQuizQuestions(quizId);
    
    res.json(questions);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    res.status(500).json({ message: "Failed to fetch quiz questions" });
  }
}

// Add a question to a quiz
export async function addQuizQuestion(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const quizId = parseInt(req.params.id, 10);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    // Check if quiz exists
    const quiz = await storage.getQuizById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    // Check permissions
    if (quiz.createdById !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to modify this quiz" });
    }

    const questionSchema = z.object({
      questionText: z.string().min(1, "Question text is required"),
      questionType: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().optional(),
      points: z.number().default(1),
      order: z.number().optional(),
    });

    const validatedData = questionSchema.parse(req.body);
    
    // Get the highest order to add new question at the end
    const questions = await storage.getQuizQuestions(quizId);
    const highestOrder = questions.length > 0 
      ? Math.max(...questions.map(q => q.order))
      : 0;
    
    // Create the question
    const newQuestion = await storage.createQuizQuestion({
      ...validatedData,
      quizId,
      order: validatedData.order ?? highestOrder + 1,
    });
    
    res.status(201).json(newQuestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error adding quiz question:", error);
    res.status(500).json({ message: "Failed to add quiz question" });
  }
}

// Update a quiz question
export async function updateQuizQuestion(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const questionId = parseInt(req.params.questionId, 10);
    
    if (isNaN(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    // Check if question exists
    const question = await storage.getQuizQuestionById(questionId);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    // Check permissions via quiz
    const quiz = await storage.getQuizById(question.quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    if (quiz.createdById !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to modify this quiz" });
    }

    const questionSchema = z.object({
      questionText: z.string().min(1, "Question text is required").optional(),
      questionType: z.string().optional(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().optional(),
      points: z.number().optional(),
      order: z.number().optional(),
    });

    const validatedData = questionSchema.parse(req.body);
    
    // Update the question
    const updatedQuestion = await storage.updateQuizQuestion(questionId, validatedData);
    
    res.json(updatedQuestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error updating quiz question:", error);
    res.status(500).json({ message: "Failed to update quiz question" });
  }
}

// Delete a quiz question
export async function deleteQuizQuestion(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const questionId = parseInt(req.params.questionId, 10);
    
    if (isNaN(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    // Check if question exists
    const question = await storage.getQuizQuestionById(questionId);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    // Check permissions via quiz
    const quiz = await storage.getQuizById(question.quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    if (quiz.createdById !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to modify this quiz" });
    }

    // Check if there are responses to this question
    const responses = await storage.getQuizResponsesByQuestion(questionId);
    
    if (responses.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete question with existing responses." 
      });
    }

    // Delete the question
    await storage.deleteQuizQuestion(questionId);
    
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz question:", error);
    res.status(500).json({ message: "Failed to delete quiz question" });
  }
}

// Get all quiz attempts for a quiz
export async function getQuizAttempts(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const quizId = parseInt(req.params.id, 10);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    const user = req.user as any;
    
    // Check if quiz exists
    const quiz = await storage.getQuizById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    // For trainers/admins, return all attempts
    // For trainees, return only their own attempts
    const filters: any = { quizId };
    if (user.role === 'trainee') {
      filters.userId = user.id;
    }
    
    const attempts = await storage.getQuizAttempts(filters);
    
    res.json(attempts);
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    res.status(500).json({ message: "Failed to fetch quiz attempts" });
  }
}

// Start a quiz attempt
export async function startQuizAttempt(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const quizId = parseInt(req.params.id, 10);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    // Check if quiz exists
    const quiz = await storage.getQuizById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    // Check if user is enrolled in the module's program
    const module = await storage.getProgramModuleById(quiz.moduleId);
    
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    
    const enrollment = await storage.getProgramEnrollment(module.programId, user.id);
    
    if (!enrollment && user.role === 'trainee') {
      return res.status(403).json({ message: "You must be enrolled in this program to take the quiz" });
    }

    // Create a new attempt
    const newAttempt = await storage.createQuizAttempt({
      quizId,
      userId: user.id,
    });

    // Get the questions for this quiz
    let questions = await storage.getQuizQuestions(quizId);
    
    // Randomize questions if specified in the quiz
    if (quiz.randomizeQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }
    
    // Don't send correct answers to the client
    const questionsForClient = questions.map(({ correctAnswer, ...rest }) => rest);
    
    res.status(201).json({
      attemptId: newAttempt.id,
      timeLimit: quiz.timeLimit,
      questions: questionsForClient,
    });
  } catch (error) {
    console.error("Error starting quiz attempt:", error);
    res.status(500).json({ message: "Failed to start quiz attempt" });
  }
}

// Submit a quiz attempt
export async function submitQuizAttempt(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const attemptId = parseInt(req.params.attemptId, 10);
    
    if (isNaN(attemptId)) {
      return res.status(400).json({ message: "Invalid attempt ID" });
    }

    // Check if attempt exists and belongs to user
    const attempt = await storage.getQuizAttemptById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    
    if (attempt.userId !== user.id) {
      return res.status(403).json({ message: "You don't have permission to submit this attempt" });
    }
    
    // Check if attempt is already completed
    if (attempt.endTime) {
      return res.status(400).json({ message: "This attempt has already been submitted" });
    }

    const responseSchema = z.object({
      responses: z.array(
        z.object({
          questionId: z.number(),
          userAnswer: z.string(),
        })
      ),
    });

    const validatedData = responseSchema.parse(req.body);
    
    // Get the quiz and its questions
    const quiz = await storage.getQuizById(attempt.quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    const questions = await storage.getQuizQuestions(quiz.id);
    
    // Process each response
    let totalPoints = 0;
    let earnedPoints = 0;
    
    const responsePromises = validatedData.responses.map(async (response) => {
      const question = questions.find(q => q.id === response.questionId);
      
      if (!question) {
        // Skip responses for questions that don't exist
        return null;
      }
      
      // Check if answer is correct
      let isCorrect = false;
      
      // For objective question types
      if (['multiple-choice', 'true-false'].includes(question.questionType)) {
        isCorrect = response.userAnswer === question.correctAnswer;
      }
      
      // For subjective questions, leave isCorrect as false until manual review
      
      // Add to point totals
      totalPoints += question.points;
      if (isCorrect) {
        earnedPoints += question.points;
      }
      
      // Create response record
      return storage.createQuizResponse({
        attemptId,
        questionId: response.questionId,
        userAnswer: response.userAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
      });
    });
    
    await Promise.all(responsePromises.filter(Boolean));
    
    // Calculate score and update the attempt
    const percentageScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentageScore >= (quiz.passingScore || 70);
    
    const updatedAttempt = await storage.updateQuizAttempt(attemptId, {
      endTime: new Date(),
      score: earnedPoints,
      maxPossibleScore: totalPoints,
      percentageScore,
      passed,
    });
    
    // Update program enrollment progress if this is a trainee
    if (user.role === 'trainee') {
      const module = await storage.getProgramModuleById(quiz.moduleId);
      
      if (module) {
        await storage.updateProgramEnrollmentProgress(module.programId, user.id);
      }
    }
    
    res.json({
      ...updatedAttempt,
      responses: await storage.getQuizResponsesByAttempt(attemptId),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error submitting quiz attempt:", error);
    res.status(500).json({ message: "Failed to submit quiz attempt" });
  }
}

// Get a specific attempt with responses
export async function getQuizAttempt(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const attemptId = parseInt(req.params.attemptId, 10);
    
    if (isNaN(attemptId)) {
      return res.status(400).json({ message: "Invalid attempt ID" });
    }

    // Check if attempt exists
    const attempt = await storage.getQuizAttemptById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    
    // Check permissions
    // Trainees can only view their own attempts
    // Trainers can view attempts for quizzes they created
    // Admins can view all attempts
    
    if (user.role === 'trainee' && attempt.userId !== user.id) {
      return res.status(403).json({ message: "You don't have permission to view this attempt" });
    }
    
    if (user.role === 'trainer') {
      const quiz = await storage.getQuizById(attempt.quizId);
      
      if (!quiz || (quiz.createdById !== user.id)) {
        return res.status(403).json({ message: "You don't have permission to view this attempt" });
      }
    }
    
    // Get the responses
    const responses = await storage.getQuizResponsesByAttempt(attemptId);
    
    res.json({
      ...attempt,
      responses,
    });
  } catch (error) {
    console.error("Error fetching quiz attempt:", error);
    res.status(500).json({ message: "Failed to fetch quiz attempt" });
  }
}

// Review a quiz attempt (for essay/short-answer questions)
export async function reviewQuizAttempt(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    
    // Only trainers and admins can review attempts
    if (user.role !== 'trainer' && user.role !== 'admin') {
      return res.status(403).json({ message: "Only trainers can review quiz attempts" });
    }
    
    const attemptId = parseInt(req.params.attemptId, 10);
    
    if (isNaN(attemptId)) {
      return res.status(400).json({ message: "Invalid attempt ID" });
    }

    // Check if attempt exists
    const attempt = await storage.getQuizAttemptById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    
    // Check permissions for trainer
    if (user.role === 'trainer') {
      const quiz = await storage.getQuizById(attempt.quizId);
      
      if (!quiz || (quiz.createdById !== user.id)) {
        return res.status(403).json({ message: "You don't have permission to review this attempt" });
      }
    }

    const reviewSchema = z.object({
      feedback: z.string().optional(),
      responses: z.array(
        z.object({
          responseId: z.number(),
          isCorrect: z.boolean(),
          points: z.number().min(0),
          feedback: z.string().optional(),
        })
      ),
    });

    const validatedData = reviewSchema.parse(req.body);
    
    // Update each response
    let totalPoints = 0;
    let earnedPoints = 0;
    
    await Promise.all(
      validatedData.responses.map(async (responseReview) => {
        const response = await storage.getQuizResponseById(responseReview.responseId);
        
        if (!response || response.attemptId !== attemptId) {
          // Skip responses that don't exist or don't belong to this attempt
          return;
        }
        
        // Update the response
        await storage.updateQuizResponse(response.id, {
          isCorrect: responseReview.isCorrect,
          points: responseReview.points,
          feedback: responseReview.feedback,
        });
        
        // Get the question to add to total points
        const question = await storage.getQuizQuestionById(response.questionId);
        
        if (question) {
          totalPoints += question.points;
          earnedPoints += responseReview.points;
        }
      })
    );
    
    // Calculate updated score and update the attempt
    const percentageScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const quiz = await storage.getQuizById(attempt.quizId);
    const passed = percentageScore >= (quiz?.passingScore || 70);
    
    const updatedAttempt = await storage.updateQuizAttempt(attemptId, {
      score: earnedPoints,
      maxPossibleScore: totalPoints,
      percentageScore,
      passed,
      reviewedBy: user.id,
      reviewDate: new Date(),
      feedback: validatedData.feedback,
    });
    
    // Update program enrollment progress
    const traineeUser = await storage.getUserById(attempt.userId);
    
    if (traineeUser && traineeUser.role === 'trainee' && quiz) {
      const module = await storage.getProgramModuleById(quiz.moduleId);
      
      if (module) {
        await storage.updateProgramEnrollmentProgress(module.programId, traineeUser.id);
      }
    }
    
    res.json({
      ...updatedAttempt,
      responses: await storage.getQuizResponsesByAttempt(attemptId),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Error reviewing quiz attempt:", error);
    res.status(500).json({ message: "Failed to review quiz attempt" });
  }
}