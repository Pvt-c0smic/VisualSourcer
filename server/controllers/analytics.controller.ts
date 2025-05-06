import { Request, Response } from "express";
import {
  getEnrollmentStatistics,
  getUserSkillProgress,
  predictSkillGrowth,
  analyzeSkillGaps,
  generatePersonalizedRecommendations,
  getOrganizationAnalytics
} from "../services/analytics.service";

/**
 * Get enrollment statistics
 */
export async function getEnrollmentStats(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const stats = await getEnrollmentStatistics(
      startDate as string,
      endDate as string
    );
    return res.json(stats);
  } catch (error) {
    console.error('Error in getEnrollmentStats:', error);
    return res.status(500).json({
      message: "Failed to retrieve enrollment statistics"
    });
  }
}

/**
 * Get skill progress for a user
 */
export async function getSkillProgress(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }
    
    const skillProgress = await getUserSkillProgress(userId);
    return res.json(skillProgress);
  } catch (error) {
    console.error('Error in getSkillProgress:', error);
    return res.status(500).json({
      message: "Failed to retrieve skill progress data"
    });
  }
}

/**
 * Get skill growth predictions for a user
 */
export async function getSkillPredictions(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }
    
    const predictions = await predictSkillGrowth(userId);
    return res.json(predictions);
  } catch (error) {
    console.error('Error in getSkillPredictions:', error);
    return res.status(500).json({
      message: "Failed to generate skill predictions"
    });
  }
}

/**
 * Get skill gap analysis for a user
 */
export async function getSkillGapAnalysis(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }
    
    const gapAnalysis = await analyzeSkillGaps(userId);
    return res.json(gapAnalysis);
  } catch (error) {
    console.error('Error in getSkillGapAnalysis:', error);
    return res.status(500).json({
      message: "Failed to analyze skill gaps"
    });
  }
}

/**
 * Get personalized training recommendations for a user
 */
export async function getPersonalizedRecommendations(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }
    
    const recommendations = await generatePersonalizedRecommendations(userId);
    return res.json(recommendations);
  } catch (error) {
    console.error('Error in getPersonalizedRecommendations:', error);
    return res.status(500).json({
      message: "Failed to generate personalized recommendations"
    });
  }
}

/**
 * Get organization-wide analytics
 */
export async function getOrgAnalytics(req: Request, res: Response) {
  try {
    const analytics = await getOrganizationAnalytics();
    return res.json(analytics);
  } catch (error) {
    console.error('Error in getOrgAnalytics:', error);
    return res.status(500).json({
      message: "Failed to retrieve organization analytics"
    });
  }
}