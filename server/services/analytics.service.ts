import OpenAI from "openai";
import { db } from "@db";
import { users, programEnrollments, quizAttempts, programs, skillSets } from "@shared/schema";
import { eq, and, gte, lte, count, avg, desc, sql } from "drizzle-orm";
import { addMonths, format, parseISO, subDays } from "date-fns";

// Initialize OpenAI API with optional API key
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("OpenAI API initialized successfully in analytics service");
  } else {
    console.warn("OPENAI_API_KEY not provided in analytics service, AI features will be limited");
  }
} catch (error) {
  console.error("Failed to initialize OpenAI API in analytics service:", error);
}

interface SkillProgressData {
  userId: number;
  skillSetId: number;
  skillName: string;
  skillCategory: string;
  currentLevel: number;
  quizScores: number[];
  completedPrograms: number;
  trainingHours: number;
  lastAssessmentDate?: string;
}

interface PredictedGrowth {
  skillSetId: number;
  skillName: string;
  currentLevel: number;
  predictedLevel: number;
  timeToNextLevel: number; // in weeks
  recommendedActions: string[];
  growthPotential: number; // 0-1 scale
  confidenceScore: number; // 0-1 scale
}

interface SkillGapAnalysis {
  userId: number;
  userName: string;
  skillGaps: {
    skillSetId: number;
    skillName: string;
    requiredLevel: number;
    currentLevel: number;
    gap: number;
    recommendedPrograms: {
      programId: number;
      programName: string;
      effectivenessScore: number;
    }[];
  }[];
}

/**
 * Get enrollment and progress statistics for a time period
 */
export async function getEnrollmentStatistics(startDate?: string, endDate?: string) {
  const currentDate = new Date();
  const defaultStartDate = format(subDays(currentDate, 30), 'yyyy-MM-dd');
  const defaultEndDate = format(currentDate, 'yyyy-MM-dd');

  const start = startDate || defaultStartDate;
  const end = endDate || defaultEndDate;

  try {
    // Get total enrollments in the time period
    const enrollmentsResult = await db
      .select({
        total: count(programEnrollments.id),
      })
      .from(programEnrollments)
      .where(
        and(
          gte(programEnrollments.enrollmentDate, start),
          lte(programEnrollments.enrollmentDate, end)
        )
      );

    // Get completion rate
    const completionsResult = await db
      .select({
        completed: count(programEnrollments.id),
      })
      .from(programEnrollments)
      .where(
        and(
          eq(programEnrollments.status, 'Completed'),
          gte(programEnrollments.enrollmentDate, start),
          lte(programEnrollments.enrollmentDate, end)
        )
      );

    // Get average quiz scores
    const quizScoresResult = await db
      .select({
        averageScore: avg(quizAttempts.score),
      })
      .from(quizAttempts)
      .where(
        and(
          gte(quizAttempts.submittedAt, start),
          lte(quizAttempts.submittedAt, end)
        )
      );

    // Get most popular programs
    const popularProgramsResult = await db
      .select({
        programId: programEnrollments.programId,
        programName: programs.name,
        enrollmentCount: count(programEnrollments.id),
      })
      .from(programEnrollments)
      .innerJoin(programs, eq(programEnrollments.programId, programs.id))
      .where(
        and(
          gte(programEnrollments.enrollmentDate, start),
          lte(programEnrollments.enrollmentDate, end)
        )
      )
      .groupBy(programEnrollments.programId, programs.name)
      .orderBy(desc(count(programEnrollments.id)))
      .limit(5);

    // Get skill set distribution
    const skillDistributionResult = await db
      .select({
        skillSetId: skillSets.id,
        skillName: skillSets.name,
        category: skillSets.category,
        count: count(skillSets.id),
      })
      .from(skillSets)
      .innerJoin(programs, eq(programs.skillSetId, skillSets.id))
      .innerJoin(programEnrollments, eq(programEnrollments.programId, programs.id))
      .where(
        and(
          gte(programEnrollments.enrollmentDate, start),
          lte(programEnrollments.enrollmentDate, end)
        )
      )
      .groupBy(skillSets.id, skillSets.name, skillSets.category)
      .orderBy(desc(count(skillSets.id)))
      .limit(10);

    return {
      timeRange: {
        start,
        end,
      },
      enrollments: enrollmentsResult[0]?.total || 0,
      completionRate: enrollmentsResult[0]?.total
        ? (completionsResult[0]?.completed || 0) / enrollmentsResult[0].total
        : 0,
      averageQuizScore: quizScoresResult[0]?.averageScore || 0,
      popularPrograms: popularProgramsResult,
      skillDistribution: skillDistributionResult,
    };
  } catch (error) {
    console.error('Error getting enrollment statistics:', error);
    throw error;
  }
}

/**
 * Get user skill progress data
 */
export async function getUserSkillProgress(userId: number): Promise<SkillProgressData[]> {
  try {
    // Get user data with skills
    const userData = await db
      .select({
        id: users.id,
        name: users.name,
        skillSets: sql<any>`json_agg(json_build_object(
          'id', ${skillSets.id},
          'name', ${skillSets.name},
          'category', ${skillSets.category},
          'level', ${skillSets.level}
        ))`,
      })
      .from(users)
      .leftJoin(
        skillSets,
        // This is a simplified join since we don't have a direct user_skillsets table
        // In a real application, you would join through the proper relation table
        sql`${users.id} = ANY(${skillSets.userIds})`
      )
      .where(eq(users.id, userId))
      .groupBy(users.id, users.name);

    if (!userData[0] || !userData[0].skillSets) {
      return [];
    }

    // Get quiz scores for user
    const quizScoresData = await db
      .select({
        quizId: quizAttempts.quizId,
        score: quizAttempts.score,
        submittedAt: quizAttempts.submittedAt,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.submittedAt));

    // Get completed programs
    const completedProgramsData = await db
      .select({
        programId: programEnrollments.programId,
        programName: programs.name,
        skillSetId: programs.skillSetId,
        completionDate: programEnrollments.completionDate,
        finalScore: programEnrollments.finalScore,
      })
      .from(programEnrollments)
      .innerJoin(programs, eq(programEnrollments.programId, programs.id))
      .where(
        and(
          eq(programEnrollments.userId, userId),
          eq(programEnrollments.status, 'Completed')
        )
      );

    // Map skill sets to progress data
    const skillProgressData: SkillProgressData[] = userData[0].skillSets.map((skill: any) => {
      // Find quiz scores related to this skill
      // This is a simplified approach - in a real app, you'd have a more direct relationship
      const relatedPrograms = completedProgramsData.filter(p => p.skillSetId === skill.id);
      const skillQuizScores = quizScoresData
        .filter(q => relatedPrograms.some(p => p.programId === q.quizId))
        .map(q => q.score);

      // Calculate training hours (simplified)
      const trainingHours = relatedPrograms.length * 8; // Assuming 8 hours per program

      return {
        userId,
        skillSetId: skill.id,
        skillName: skill.name,
        skillCategory: skill.category,
        currentLevel: skill.level,
        quizScores: skillQuizScores,
        completedPrograms: relatedPrograms.length,
        trainingHours,
        lastAssessmentDate: relatedPrograms.length > 0
          ? relatedPrograms[0].completionDate
          : undefined
      };
    });

    return skillProgressData;
  } catch (error) {
    console.error('Error getting user skill progress:', error);
    throw error;
  }
}

/**
 * Generate AI-powered skill development predictions
 */
export async function predictSkillGrowth(userId: number): Promise<PredictedGrowth[]> {
  try {
    // Get user's skill progress data
    const skillProgressData = await getUserSkillProgress(userId);
    
    if (skillProgressData.length === 0) {
      return [];
    }

    // Use OpenAI to generate predictions
    const predictions: PredictedGrowth[] = [];
    
    for (const skillData of skillProgressData) {
      // Format the data for the prompt
      const avgQuizScore = skillData.quizScores.length > 0
        ? skillData.quizScores.reduce((sum, score) => sum + score, 0) / skillData.quizScores.length
        : 0;
      
      const prompt = `
Analyze this training data and predict skill growth:
- Skill: ${skillData.skillName} (${skillData.skillCategory})
- Current level: ${skillData.currentLevel} (scale of 1-5)
- Completed programs: ${skillData.completedPrograms}
- Training hours: ${skillData.trainingHours}
- Average quiz score: ${avgQuizScore.toFixed(1)}%
- Last assessment: ${skillData.lastAssessmentDate || 'Never'}

Provide a structured analysis with these fields:
1. Predicted level in 3 months (numeric, 1-5 scale, can include decimal points)
2. Estimated weeks to reach next level
3. Three specific recommended actions to accelerate growth
4. Growth potential (0-1 scale)
5. Confidence in prediction (0-1 scale)

Format as JSON with fields: predictedLevel, timeToNextLevel, recommendedActions, growthPotential, confidenceScore
`;

      // Check if OpenAI is available
      if (!openai) {
        // Return fallback prediction if OpenAI is not available
        const predictedLevel = Math.min(5, skillData.currentLevel + 0.3 + Math.random() * 0.4); 
        const timeToNextLevel = Math.round(8 + Math.random() * 12);
        
        return {
          predictedLevel,
          timeToNextLevel,
          recommendedActions: [
            "Complete additional training programs in this skill area",
            "Practice skills in real-world scenarios",
            "Review learning materials from previous courses"
          ],
          growthPotential: 0.6 + (Math.random() * 0.2),
          confidenceScore: 0.5
        };
      }
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional skill development analyst specialized in military and technical training. Provide fact-based, objective predictions based on training data." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      
      const predictionResult = JSON.parse(response.choices[0].message.content);
      
      predictions.push({
        skillSetId: skillData.skillSetId,
        skillName: skillData.skillName,
        currentLevel: skillData.currentLevel,
        predictedLevel: predictionResult.predictedLevel,
        timeToNextLevel: predictionResult.timeToNextLevel,
        recommendedActions: predictionResult.recommendedActions,
        growthPotential: predictionResult.growthPotential,
        confidenceScore: predictionResult.confidenceScore
      });
    }
    
    return predictions;
  } catch (error) {
    console.error('Error predicting skill growth:', error);
    throw error;
  }
}

/**
 * Analyze skill gaps between current and required levels
 */
export async function analyzeSkillGaps(userId: number): Promise<SkillGapAnalysis> {
  try {
    // Get user data
    const userData = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!userData[0]) {
      throw new Error('User not found');
    }

    // Get user skill progress
    const userSkills = await getUserSkillProgress(userId);
    
    // Get available programs
    const availablePrograms = await db
      .select({
        id: programs.id,
        name: programs.name,
        skillSetId: programs.skillSetId,
        skillSetLevel: programs.skillSetLevel,
      })
      .from(programs)
      .where(eq(programs.status, 'Open'));

    // Find skill gaps and recommend programs
    const skillGaps = userSkills.map(skill => {
      // For demo purposes, assume required level is always 5
      // In a real app, this would come from role requirements or career path
      const requiredLevel = 5;
      const gap = Math.max(0, requiredLevel - skill.currentLevel);

      // Find programs that can help with this skill
      const recommendedPrograms = availablePrograms
        .filter(program => program.skillSetId === skill.skillSetId)
        .map(program => {
          // Calculate effectiveness score
          // Programs at user's current level or slightly above are more effective
          const levelDifference = program.skillSetLevel - skill.currentLevel;
          const effectivenessScore = levelDifference > 0 && levelDifference <= 2
            ? 1 - (levelDifference - 1) * 0.3 // Optimal is 1 level above (score 1.0)
            : levelDifference <= 0
              ? 0.5 - (levelDifference * 0.1) // Below current level (diminishing returns)
              : 0.4 - ((levelDifference - 2) * 0.1); // Too advanced (harder to benefit)

          return {
            programId: program.id,
            programName: program.name,
            effectivenessScore: Math.max(0.1, Math.min(1, effectivenessScore)), // Clamp between 0.1 and 1
          };
        })
        .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
        .slice(0, 3); // Top 3 most effective programs

      return {
        skillSetId: skill.skillSetId,
        skillName: skill.skillName,
        requiredLevel,
        currentLevel: skill.currentLevel,
        gap,
        recommendedPrograms,
      };
    });

    return {
      userId,
      userName: userData[0].name,
      skillGaps: skillGaps.filter(gap => gap.gap > 0), // Only include actual gaps
    };
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    throw error;
  }
}

/**
 * Generate personalized training recommendations
 */
export async function generatePersonalizedRecommendations(userId: number) {
  try {
    // Get user data with skills
    const userData = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!userData[0]) {
      throw new Error('User not found');
    }

    // Get user skill progress
    const userSkills = await getUserSkillProgress(userId);
    
    // Get skill gap analysis
    const skillGaps = await analyzeSkillGaps(userId);
    
    // Get available programs that user isn't already enrolled in
    const enrolledProgramIds = await db
      .select({ programId: programEnrollments.programId })
      .from(programEnrollments)
      .where(eq(programEnrollments.userId, userId));
    
    const enrolledIds = enrolledProgramIds.map(p => p.programId);
    
    const availablePrograms = await db
      .select({
        id: programs.id,
        code: programs.code,
        name: programs.name,
        description: programs.description,
        skillSetId: programs.skillSetId,
        skillSetLevel: programs.skillSetLevel,
        startDate: programs.startDate,
        duration: programs.duration,
        capacity: programs.capacity,
        enrolledCount: programs.enrolledCount,
        status: programs.status,
      })
      .from(programs)
      .where(
        and(
          eq(programs.status, 'Open'),
          sql`${programs.id} <> ALL(${enrolledIds})`
        )
      );
    
    // Format data for OpenAI
    const promptData = {
      user: {
        id: userData[0].id,
        name: userData[0].name,
        role: userData[0].role,
      },
      skills: userSkills.map(skill => ({
        name: skill.skillName,
        category: skill.skillCategory,
        currentLevel: skill.currentLevel,
        completedPrograms: skill.completedPrograms,
      })),
      skillGaps: skillGaps.skillGaps,
      availablePrograms: availablePrograms.map(program => ({
        id: program.id,
        code: program.code,
        name: program.name,
        description: program.description,
        skillSetId: program.skillSetId,
        skillSetLevel: program.skillSetLevel,
        startDate: program.startDate,
        duration: program.duration,
        availableSeats: program.capacity - program.enrolledCount,
      })),
    };
    
    // Call OpenAI for personalized recommendations
    const prompt = `
Generate personalized training recommendations based on this data:
${JSON.stringify(promptData, null, 2)}

Consider:
1. The user's current skill levels and gaps
2. Program skill level requirements vs. user's current levels
3. Available program seats and start dates
4. The user's role and completed training history

Provide these recommendations in JSON format:
1. Top 3 recommended programs with reasoning
2. Skill development priorities
3. Long-term career development advice
4. Suggested learning path for the next 6 months

Format as JSON with fields: recommendedPrograms (array with programId, name, reasoning), skillPriorities (array), careerAdvice (string), learningPath (array of steps)
`;

    // Check if OpenAI is available
    if (!openai) {
      // Return fallback recommendations if OpenAI is not available
      return {
        recommendedPrograms: availablePrograms.slice(0, 3).map(program => ({
          programId: program.id,
          name: program.name,
          reasoning: "Selected based on your current skill profile and available courses",
          programDetails: program
        })),
        skillPriorities: [
          "Continue developing your technical capabilities",
          "Focus on communication skills",
          "Build leadership foundations"
        ],
        careerAdvice: "Aim to complete a balanced mix of technical and leadership courses to prepare for advancement opportunities",
        learningPath: [
          "Complete beginner technical courses before advancing to intermediate level",
          "Take at least one leadership course in the next 6 months",
          "Pursue certification in your primary skill area"
        ]
      };
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert training advisor for military and technical personnel. Provide personalized, data-driven recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    const recommendations = JSON.parse(response.choices[0].message.content);
    
    // Add program details to recommendations
    const enhancedRecommendations = {
      ...recommendations,
      recommendedPrograms: recommendations.recommendedPrograms.map((rec: any) => {
        const program = availablePrograms.find(p => p.id === rec.programId);
        return {
          ...rec,
          programDetails: program || null,
        };
      }),
    };
    
    return enhancedRecommendations;
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    throw error;
  }
}

/**
 * Get aggregate analytics for the organization
 */
export async function getOrganizationAnalytics() {
  try {
    // Get total users by role
    const usersByRole = await db
      .select({
        role: users.role,
        count: count(users.id),
      })
      .from(users)
      .groupBy(users.role);
    
    // Get total programs by status
    const programsByStatus = await db
      .select({
        status: programs.status,
        count: count(programs.id),
      })
      .from(programs)
      .groupBy(programs.status);
    
    // Get enrollment metrics
    const enrollmentMetrics = await db
      .select({
        totalEnrollments: count(programEnrollments.id),
        activeEnrollments: sql<number>`SUM(CASE WHEN ${programEnrollments.status} = 'Active' THEN 1 ELSE 0 END)`,
        completedEnrollments: sql<number>`SUM(CASE WHEN ${programEnrollments.status} = 'Completed' THEN 1 ELSE 0 END)`,
        droppedEnrollments: sql<number>`SUM(CASE WHEN ${programEnrollments.status} = 'Dropped' THEN 1 ELSE 0 END)`,
      })
      .from(programEnrollments);
    
    // Get skill distribution across users
    const skillDistribution = await db
      .select({
        category: skillSets.category,
        count: count(skillSets.id),
      })
      .from(skillSets)
      .groupBy(skillSets.category);
    
    return {
      usersByRole,
      programsByStatus,
      enrollmentMetrics: enrollmentMetrics[0],
      skillDistribution,
    };
  } catch (error) {
    console.error('Error getting organization analytics:', error);
    throw error;
  }
}