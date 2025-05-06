import { Request, Response } from 'express';
import { db } from '@db';
import { eq, and, desc, lte, gte, sql } from 'drizzle-orm';
import { programs, skillSets, users, programEnrollments, quizAttempts, quizzes } from '@shared/schema';
import OpenAI from 'openai';

// Initialize OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

/**
 * Get enrollment statistics
 */
export async function getEnrollmentStats(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse date filters
    const startFilter = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endFilter = endDate ? new Date(endDate as string) : new Date();
    
    // Get enrollment count in date range
    const enrollmentResult = await db.select({
      count: sql<number>`count(*)`,
    }).from(programEnrollments)
      .where(
        and(
          gte(programEnrollments.enrollmentDate, startFilter.toISOString()),
          lte(programEnrollments.enrollmentDate, endFilter.toISOString())
        )
      );
    
    const enrollments = enrollmentResult[0]?.count || 0;
    
    // Calculate completion rate
    const completionResult = await db.select({
      completed: sql<number>`count(*) filter (where ${programEnrollments.status} = 'Completed')`,
      total: sql<number>`count(*)`,
    }).from(programEnrollments)
      .where(
        and(
          gte(programEnrollments.enrollmentDate, startFilter.toISOString()),
          lte(programEnrollments.enrollmentDate, endFilter.toISOString())
        )
      );
    
    const completionRate = completionResult[0]?.total > 0 
      ? completionResult[0].completed / completionResult[0].total 
      : 0;
    
    // Calculate average quiz score
    const quizScoreResult = await db.select({
      avgScore: sql<number>`avg(${quizAttempts.score})`,
    }).from(quizAttempts)
      .where(
        and(
          gte(quizAttempts.completedAt, startFilter.toISOString()),
          lte(quizAttempts.completedAt, endFilter.toISOString()),
          eq(quizAttempts.status, 'Completed')
        )
      );
    
    const averageQuizScore = quizScoreResult[0]?.avgScore || 0;
    
    // Get popular programs
    const popularPrograms = await db.select({
      programId: programEnrollments.programId,
      programName: programs.name,
      enrollmentCount: sql<number>`count(*)`,
    })
      .from(programEnrollments)
      .leftJoin(programs, eq(programEnrollments.programId, programs.id))
      .where(
        and(
          gte(programEnrollments.enrollmentDate, startFilter.toISOString()),
          lte(programEnrollments.enrollmentDate, endFilter.toISOString())
        )
      )
      .groupBy(programEnrollments.programId, programs.name)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(5);
    
    // Get skill distribution
    const skillDistribution = await db.select({
      category: skillSets.category,
      count: sql<number>`count(*)`,
    })
      .from(programs)
      .leftJoin(skillSets, eq(programs.skillSetId, skillSets.id))
      .leftJoin(programEnrollments, eq(programs.id, programEnrollments.programId))
      .where(
        and(
          gte(programEnrollments.enrollmentDate, startFilter.toISOString()),
          lte(programEnrollments.enrollmentDate, endFilter.toISOString())
        )
      )
      .groupBy(skillSets.category)
      .orderBy(desc(sql<number>`count(*)`));
    
    res.json({
      enrollments,
      completionRate,
      averageQuizScore,
      popularPrograms,
      skillDistribution,
    });
  } catch (error) {
    console.error('Error getting enrollment stats:', error);
    res.status(500).json({ error: 'Failed to get enrollment statistics' });
  }
}

/**
 * Get skill progress for a user
 */
export async function getSkillProgress(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get all completed programs by this user
    const userPrograms = await db.select({
      programId: programEnrollments.programId,
      enrollmentDate: programEnrollments.enrollmentDate,
      completionDate: programEnrollments.completionDate,
      status: programEnrollments.status,
      programName: programs.name,
      skillSetId: programs.skillSetId,
      skillSetLevel: programs.skillSetLevel,
      skillName: skillSets.name,
      skillCategory: skillSets.category,
    })
      .from(programEnrollments)
      .leftJoin(programs, eq(programEnrollments.programId, programs.id))
      .leftJoin(skillSets, eq(programs.skillSetId, skillSets.id))
      .where(eq(programEnrollments.userId, userId));
    
    // Get quiz attempts and scores for each program
    const quizScores = await db.select({
      programId: quizzes.programId,
      score: quizAttempts.score,
      completedAt: quizAttempts.completedAt,
    })
      .from(quizAttempts)
      .leftJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.status, 'Completed')
        )
      )
      .orderBy(quizAttempts.completedAt);
    
    // Calculate skill levels based on completed programs and quiz scores
    const skillProgressMap = new Map<number, any>();
    
    // Process completed programs
    userPrograms.forEach(program => {
      if (!skillProgressMap.has(program.skillSetId)) {
        skillProgressMap.set(program.skillSetId, {
          skillSetId: program.skillSetId,
          skillName: program.skillName,
          skillCategory: program.skillCategory,
          programs: [],
          completedPrograms: 0,
          highestLevel: 0,
          quizScores: [],
          averageScore: 0,
          currentLevel: 1, // Default level
          lastActivity: null,
        });
      }
      
      const skillProgress = skillProgressMap.get(program.skillSetId);
      
      skillProgress.programs.push({
        programId: program.programId,
        programName: program.programName,
        status: program.status,
        enrollmentDate: program.enrollmentDate,
        completionDate: program.completionDate,
        level: program.skillSetLevel,
      });
      
      if (program.status === 'Completed') {
        skillProgress.completedPrograms += 1;
        skillProgress.highestLevel = Math.max(skillProgress.highestLevel, program.skillSetLevel);
        
        if (!skillProgress.lastActivity || new Date(program.completionDate) > new Date(skillProgress.lastActivity)) {
          skillProgress.lastActivity = program.completionDate;
        }
      }
      
      skillProgressMap.set(program.skillSetId, skillProgress);
    });
    
    // Add quiz scores to skill progress
    quizScores.forEach(quiz => {
      const relevantProgram = userPrograms.find(p => p.programId === quiz.programId);
      
      if (relevantProgram && skillProgressMap.has(relevantProgram.skillSetId)) {
        const skillProgress = skillProgressMap.get(relevantProgram.skillSetId);
        skillProgress.quizScores.push(quiz.score);
        
        if (!skillProgress.lastActivity || new Date(quiz.completedAt) > new Date(skillProgress.lastActivity)) {
          skillProgress.lastActivity = quiz.completedAt;
        }
        
        skillProgressMap.set(relevantProgram.skillSetId, skillProgress);
      }
    });
    
    // Calculate current levels and average scores
    for (const [skillSetId, progress] of skillProgressMap.entries()) {
      // Calculate average quiz score
      if (progress.quizScores.length > 0) {
        progress.averageScore = 
          progress.quizScores.reduce((sum: number, score: number) => sum + score, 0) / 
          progress.quizScores.length;
      }
      
      // Calculate current level based on completed programs and highest level
      if (progress.completedPrograms >= 3 && progress.highestLevel >= 3 && progress.averageScore >= 80) {
        progress.currentLevel = 5; // Expert
      } else if (progress.completedPrograms >= 2 && progress.highestLevel >= 2 && progress.averageScore >= 70) {
        progress.currentLevel = 4; // Advanced
      } else if (progress.completedPrograms >= 1 && progress.highestLevel >= 2) {
        progress.currentLevel = 3; // Intermediate
      } else if (progress.completedPrograms >= 1) {
        progress.currentLevel = 2; // Beginner
      }
      
      skillProgressMap.set(skillSetId, progress);
    }
    
    const skillProgress = Array.from(skillProgressMap.values());
    
    res.json(skillProgress);
  } catch (error) {
    console.error('Error getting skill progress:', error);
    res.status(500).json({ error: 'Failed to get skill progress' });
  }
}

/**
 * Get skill growth predictions for a user
 */
export async function getSkillPredictions(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get user's skill progress data
    const skillProgress = await getSkillProgressData(userId);
    
    if (!skillProgress || skillProgress.length === 0) {
      return res.json([]);
    }
    
    // Use OpenAI API to generate predictions
    const predictions = await generateSkillPredictions(userId, skillProgress);
    
    res.json(predictions);
  } catch (error) {
    console.error('Error generating skill predictions:', error);
    res.status(500).json({ error: 'Failed to generate skill predictions' });
  }
}

/**
 * Get skill gap analysis for a user
 */
export async function getSkillGapAnalysis(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get user details
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult[0];
    
    // Get user's current skills
    const skillProgress = await getSkillProgressData(userId);
    
    if (!skillProgress || skillProgress.length === 0) {
      return res.json({ 
        user: { id: user.id, name: user.name, role: user.role },
        skillGaps: [] 
      });
    }
    
    // Get recommended programs to fill gaps
    const skillGaps = await analyzeSkillGaps(user, skillProgress);
    
    res.json({
      user: { id: user.id, name: user.name, role: user.role },
      skillGaps
    });
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    res.status(500).json({ error: 'Failed to analyze skill gaps' });
  }
}

/**
 * Get personalized training recommendations for a user
 */
export async function getPersonalizedRecommendations(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get user details
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult[0];
    
    // Get user's current skills
    const skillProgress = await getSkillProgressData(userId);
    
    // Use OpenAI to generate personalized recommendations
    const recommendations = await generatePersonalizedRecommendations(user, skillProgress);
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate personalized recommendations' });
  }
}

/**
 * Get organization-wide analytics
 */
export async function getOrgAnalytics(req: Request, res: Response) {
  try {
    // Get user counts by role
    const usersByRole = await db.select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
      .from(users)
      .groupBy(users.role);
    
    // Get program completion trends
    const completionTrends = await db.select({
      month: sql<string>`to_char(${programEnrollments.completionDate}::date, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
    })
      .from(programEnrollments)
      .where(eq(programEnrollments.status, 'Completed'))
      .groupBy(sql<string>`to_char(${programEnrollments.completionDate}::date, 'YYYY-MM')`)
      .orderBy(sql<string>`to_char(${programEnrollments.completionDate}::date, 'YYYY-MM')`);
    
    // Get skill distribution across organization
    const skillDistribution = await db.select({
      category: skillSets.category,
      count: sql<number>`count(distinct ${programEnrollments.userId})`,
    })
      .from(programEnrollments)
      .leftJoin(programs, eq(programEnrollments.programId, programs.id))
      .leftJoin(skillSets, eq(programs.skillSetId, skillSets.id))
      .where(eq(programEnrollments.status, 'Completed'))
      .groupBy(skillSets.category);
    
    res.json({
      usersByRole,
      completionTrends,
      skillDistribution,
    });
  } catch (error) {
    console.error('Error getting organization analytics:', error);
    res.status(500).json({ error: 'Failed to get organization analytics' });
  }
}

// Helper functions for analytics

/**
 * Get skill progress data for a user
 */
async function getSkillProgressData(userId: number) {
  // Call the existing controller logic
  const req = { params: { userId: userId.toString() } } as Request;
  const res = {
    json: (data: any) => data,
    status: () => ({ json: (data: any) => data }),
  } as unknown as Response;
  
  return await getSkillProgress(req, res);
}

/**
 * Generate skill predictions using OpenAI
 */
async function generateSkillPredictions(userId: number, skillProgress: any[]) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, returning placeholder predictions');
      return skillProgress.map(skill => ({
        skillSetId: skill.skillSetId,
        skillName: skill.skillName,
        currentLevel: skill.currentLevel,
        predictedLevel: Math.min(5, skill.currentLevel + 0.5),
        timeToNextLevel: Math.round(Math.random() * 8 + 4),
        growthPotential: Math.random() * 0.5 + 0.3,
        confidenceScore: 0.7,
        recommendedActions: [
          "Complete additional training in this area",
          "Practice skills through hands-on exercises"
        ]
      }));
    }
    
    // Prepare prompt for OpenAI
    const prompt = `
You are an AI skill development advisor for a military training platform. Analyze the following user's skill data and provide predictions about their skill growth potential:

User ID: ${userId}

Skill Progress Data:
${JSON.stringify(skillProgress, null, 2)}

For each skill, predict:
1. The predicted skill level growth (as a decimal number, e.g., current level 3 might grow to 3.7)
2. Estimated time (in weeks) to reach the next full level
3. Growth potential score (0-1 scale)
4. Confidence score for this prediction (0-1 scale)
5. 2-3 specific recommended actions to accelerate growth

Return the predictions as a JSON array with objects containing:
- skillSetId (number)
- skillName (string)
- currentLevel (number)
- predictedLevel (number with 1 decimal place)
- timeToNextLevel (number of weeks)
- growthPotential (decimal 0-1)
- confidenceScore (decimal 0-1)
- recommendedActions (array of strings)
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are a skill assessment and development AI that analyzes training data and makes predictive growth analyses." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI API");
    }

    const predictions = JSON.parse(content);
    return predictions.predictions || [];
  } catch (error) {
    console.error('Error generating skill predictions:', error);
    
    // Fallback to basic predictions if OpenAI call fails
    return skillProgress.map(skill => ({
      skillSetId: skill.skillSetId,
      skillName: skill.skillName,
      currentLevel: skill.currentLevel,
      predictedLevel: Math.min(5, skill.currentLevel + 0.5),
      timeToNextLevel: Math.round(Math.random() * 8 + 4),
      growthPotential: Math.random() * 0.5 + 0.3,
      confidenceScore: 0.7,
      recommendedActions: [
        "Complete additional training in this area",
        "Practice skills through hands-on exercises"
      ]
    }));
  }
}

/**
 * Analyze skill gaps and recommend programs
 */
async function analyzeSkillGaps(user: any, skillProgress: any[]) {
  try {
    const userRole = user.role;
    
    // Get all available programs
    const allPrograms = await db.select({
      id: programs.id,
      name: programs.name,
      description: programs.description,
      skillSetId: programs.skillSetId,
      skillSetLevel: programs.skillSetLevel,
      skillName: skillSets.name,
      skillCategory: skillSets.category,
    })
      .from(programs)
      .leftJoin(skillSets, eq(programs.skillSetId, skillSets.id))
      .where(eq(programs.status, 'Open'));
    
    // Identify required skills based on user role
    let requiredSkills: any[] = [];
    
    if (userRole === 'trainee') {
      requiredSkills = [
        { category: 'Technical', minLevel: 3 },
        { category: 'Communication', minLevel: 2 },
        { category: 'Operational', minLevel: 2 },
      ];
    } else if (userRole === 'trainer') {
      requiredSkills = [
        { category: 'Technical', minLevel: 4 },
        { category: 'Leadership', minLevel: 3 },
        { category: 'Communication', minLevel: 4 },
        { category: 'Operational', minLevel: 3 },
      ];
    } else if (userRole === 'admin') {
      requiredSkills = [
        { category: 'Leadership', minLevel: 4 },
        { category: 'Technical', minLevel: 3 },
        { category: 'Communication', minLevel: 3 },
      ];
    }
    
    // Identify skill gaps
    const skillGaps = [];
    
    // Check each skill in skill progress against required skills
    for (const skill of skillProgress) {
      const requiredSkill = requiredSkills.find(rs => rs.category === skill.skillCategory);
      
      if (requiredSkill && skill.currentLevel < requiredSkill.minLevel) {
        // This is a skill gap
        const gap = requiredSkill.minLevel - skill.currentLevel;
        
        // Find programs that can help bridge this gap
        const recommendedPrograms = allPrograms
          .filter(program => 
            program.skillSetId === skill.skillSetId && 
            program.skillSetLevel > skill.currentLevel &&
            program.skillSetLevel <= requiredSkill.minLevel
          )
          .map(program => ({
            programId: program.id,
            programName: program.name,
            description: program.description,
            level: program.skillSetLevel,
            effectivenessScore: (program.skillSetLevel - skill.currentLevel) / gap
          }))
          .sort((a, b) => b.effectivenessScore - a.effectivenessScore);
        
        skillGaps.push({
          skillSetId: skill.skillSetId,
          skillName: skill.skillName,
          skillCategory: skill.skillCategory,
          currentLevel: skill.currentLevel,
          requiredLevel: requiredSkill.minLevel,
          gap,
          recommendedPrograms
        });
      }
    }
    
    // Check if there are any required skills the user doesn't have at all
    for (const requiredSkill of requiredSkills) {
      const hasSkill = skillProgress.some(skill => skill.skillCategory === requiredSkill.category);
      
      if (!hasSkill) {
        // Find entry-level programs for this skill category
        const recommendedPrograms = allPrograms
          .filter(program => 
            program.skillCategory === requiredSkill.category && 
            program.skillSetLevel <= requiredSkill.minLevel
          )
          .map(program => ({
            programId: program.id,
            programName: program.name,
            description: program.description,
            level: program.skillSetLevel,
            effectivenessScore: program.skillSetLevel / requiredSkill.minLevel
          }))
          .sort((a, b) => b.effectivenessScore - a.effectivenessScore);
        
        const skillName = allPrograms.find(p => p.skillCategory === requiredSkill.category)?.skillName || requiredSkill.category;
        
        skillGaps.push({
          skillSetId: null,
          skillName,
          skillCategory: requiredSkill.category,
          currentLevel: 0,
          requiredLevel: requiredSkill.minLevel,
          gap: requiredSkill.minLevel,
          recommendedPrograms
        });
      }
    }
    
    return skillGaps;
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    return [];
  }
}

/**
 * Generate personalized recommendations using OpenAI
 */
async function generatePersonalizedRecommendations(user: any, skillProgress: any[]) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, returning placeholder recommendations');
      return {
        recommendedPrograms: [
          { 
            id: 1, 
            name: "Advanced Communication Skills", 
            matchScore: 0.85, 
            reasoning: "Based on your current skills and career path"
          }
        ],
        skillPriorities: [
          "Focus on improving technical skills",
          "Develop leadership capabilities",
          "Enhance operational knowledge"
        ],
        careerAdvice: "Consider specializing in your strongest skill areas while addressing gaps in others."
      };
    }
    
    // Get all available programs
    const allPrograms = await db.select({
      id: programs.id,
      name: programs.name,
      description: programs.description,
      skillSetId: programs.skillSetId,
      skillSetLevel: programs.skillSetLevel,
      skillName: skillSets.name,
      skillCategory: skillSets.category,
    })
      .from(programs)
      .leftJoin(skillSets, eq(programs.skillSetId, skillSets.id))
      .where(eq(programs.status, 'Open'));
    
    // Prepare prompt for OpenAI
    const prompt = `
You are an AI career development advisor for a military training platform. Analyze the following user's profile and skill data and provide personalized training recommendations:

User Profile:
${JSON.stringify({
  id: user.id,
  name: user.name,
  role: user.role,
  rank: user.rank,
  unit: user.unit
}, null, 2)}

Current Skills:
${JSON.stringify(skillProgress, null, 2)}

Available Training Programs:
${JSON.stringify(allPrograms, null, 2)}

Based on the user's profile, current skills, and available programs, provide:
1. Top 3 recommended training programs with reasoning
2. 3-5 prioritized skill development areas
3. Brief career development advice (1-3 sentences)

Return the recommendations as a JSON object with the following structure:
{
  "recommendedPrograms": [
    {
      "id": number,
      "name": string,
      "matchScore": number (0-1 scale),
      "reasoning": string (brief explanation)
    }
  ],
  "skillPriorities": [
    string,
    string,
    ...
  ],
  "careerAdvice": string
}

`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are a career development AI specializing in military training recommendations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI API");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    
    // Fallback to basic recommendations if OpenAI call fails
    return {
      recommendedPrograms: [
        { 
          id: 1, 
          name: "Advanced Communication Skills", 
          matchScore: 0.85, 
          reasoning: "Based on your current skills and career path"
        }
      ],
      skillPriorities: [
        "Focus on improving technical skills",
        "Develop leadership capabilities",
        "Enhance operational knowledge"
      ],
      careerAdvice: "Consider specializing in your strongest skill areas while addressing gaps in others."
    };
  }
}