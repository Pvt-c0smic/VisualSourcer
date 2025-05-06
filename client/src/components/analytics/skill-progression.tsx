import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Star,
  TrendingUp,
  Target,
  Zap,
  Award,
  LineChart,
  Lightbulb,
  ArrowRight,
  BarChart3
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

// Skill level badge colors
const levelColors = {
  1: "bg-slate-100 text-slate-800 border-slate-200",
  2: "bg-blue-100 text-blue-800 border-blue-200",
  3: "bg-green-100 text-green-800 border-green-200",
  4: "bg-amber-100 text-amber-800 border-amber-200",
  5: "bg-purple-100 text-purple-800 border-purple-200",
};

// Category colors for visualizations
const categoryColors = {
  "Technical": "#3b82f6", // blue
  "Leadership": "#10b981", // green
  "Operational": "#f59e0b", // amber
  "Communication": "#8b5cf6", // purple
  "Other": "#6b7280", // gray
};

// Achievement badge types
const achievementTypes = {
  milestone: {
    icon: <Trophy className="h-4 w-4 text-amber-600" />,
    className: "bg-amber-50 text-amber-800 border-amber-200"
  },
  improvement: {
    icon: <TrendingUp className="h-4 w-4 text-green-600" />,
    className: "bg-green-50 text-green-800 border-green-200"
  },
  mastery: {
    icon: <Star className="h-4 w-4 text-blue-600" />,
    className: "bg-blue-50 text-blue-800 border-blue-200"
  },
  consistency: {
    icon: <Target className="h-4 w-4 text-purple-600" />,
    className: "bg-purple-50 text-purple-800 border-purple-200"
  }
};

interface SkillProgressionProps {
  userId: number;
}

export default function SkillProgression({ userId }: SkillProgressionProps) {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch skill progress data
  const { data: skillProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: [`/api/analytics/users/${userId}/skill-progress`],
    enabled: !!userId,
  });
  
  // Fetch skill predictions data
  const { data: skillPredictions, isLoading: isLoadingPredictions } = useQuery({
    queryKey: [`/api/analytics/users/${userId}/skill-predictions`],
    enabled: !!userId,
  });
  
  // Fetch skill gap analysis
  const { data: skillGaps, isLoading: isLoadingGaps } = useQuery({
    queryKey: [`/api/analytics/users/${userId}/skill-gaps`],
    enabled: !!userId,
  });

  // Generate achievements based on skill data
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    if (skillProgress && skillProgress.length > 0) {
      const newAchievements = [];
      
      // Add milestone achievements
      const totalCompletedPrograms = skillProgress.reduce((sum: number, skill: any) => sum + skill.completedPrograms, 0);
      if (totalCompletedPrograms >= 5) {
        newAchievements.push({
          id: "program-milestone",
          type: "milestone",
          title: "Training Pioneer",
          description: `Completed ${totalCompletedPrograms} training programs`,
          date: new Date().toISOString().split('T')[0],
          xp: 100
        });
      }
      
      // Add skill mastery achievements
      skillProgress.forEach((skill: any) => {
        if (skill.currentLevel >= 4) {
          newAchievements.push({
            id: `mastery-${skill.skillSetId}`,
            type: "mastery",
            title: "Skill Mastery",
            description: `Achieved advanced level in ${skill.skillName}`,
            date: new Date().toISOString().split('T')[0],
            xp: 150
          });
        }
      });
      
      // Add improvement achievements
      if (skillPredictions && skillPredictions.length > 0) {
        skillPredictions.forEach((prediction: any) => {
          if (prediction.growthPotential > 0.7) {
            newAchievements.push({
              id: `potential-${prediction.skillSetId}`,
              type: "improvement",
              title: "Growth Potential",
              description: `High growth potential in ${prediction.skillName}`,
              date: new Date().toISOString().split('T')[0],
              xp: 75
            });
          }
        });
      }
      
      // Add consistency achievements based on quiz scores
      skillProgress.forEach((skill: any) => {
        if (skill.quizScores && skill.quizScores.length > 2) {
          const avgScore = skill.quizScores.reduce((sum: number, score: number) => sum + score, 0) / skill.quizScores.length;
          if (avgScore > 85) {
            newAchievements.push({
              id: `consistency-${skill.skillSetId}`,
              type: "consistency",
              title: "Consistent Performer",
              description: `Maintained high scores in ${skill.skillName} assessments`,
              date: new Date().toISOString().split('T')[0],
              xp: 120
            });
          }
        }
      });
      
      setAchievements(newAchievements);
    }
  }, [skillProgress, skillPredictions]);

  // Calculate total XP from achievements
  const totalXP = achievements.reduce((sum, achievement) => sum + achievement.xp, 0);
  
  // Calculate level based on XP (simplified formula)
  const userLevel = Math.max(1, Math.floor(Math.sqrt(totalXP / 100)) + 1);
  
  // Calculate progress to next level
  const currentLevelXP = Math.pow(userLevel - 1, 2) * 100;
  const nextLevelXP = Math.pow(userLevel, 2) * 100;
  const progressToNextLevel = nextLevelXP > currentLevelXP
    ? Math.round(((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
    : 100;

  // Prepare data for charts
  const prepareChartData = () => {
    if (!skillProgress) return [];
    
    return skillProgress.map((skill: any) => ({
      name: skill.skillName,
      currentLevel: skill.currentLevel,
      category: skill.skillCategory,
      predictedLevel: 
        skillPredictions?.find((p: any) => p.skillSetId === skill.skillSetId)?.predictedLevel || 
        skill.currentLevel,
      requiredLevel: 
        skillGaps?.skillGaps.find((g: any) => g.skillSetId === skill.skillSetId)?.requiredLevel || 
        5,
      fill: categoryColors[skill.skillCategory as keyof typeof categoryColors] || categoryColors.Other,
    }));
  };

  const chartData = prepareChartData();
  
  // Group skills by category for radar chart
  const prepareRadarData = () => {
    if (!skillProgress) return [];
    
    const categories = Array.from(new Set(skillProgress.map((skill: any) => skill.skillCategory)));
    
    return categories.map(category => {
      const categorySkills = skillProgress.filter((skill: any) => skill.skillCategory === category);
      const avgCurrentLevel = categorySkills.reduce((sum: number, skill: any) => sum + skill.currentLevel, 0) / categorySkills.length;
      
      const categoryPredictions = skillPredictions?.filter((p: any) => 
        categorySkills.some((skill: any) => skill.skillSetId === p.skillSetId)
      ) || [];
      
      const avgPredictedLevel = categoryPredictions.length > 0
        ? categoryPredictions.reduce((sum: number, pred: any) => sum + pred.predictedLevel, 0) / categoryPredictions.length
        : avgCurrentLevel;
      
      return {
        category,
        currentLevel: Math.round(avgCurrentLevel * 10) / 10,
        predictedLevel: Math.round(avgPredictedLevel * 10) / 10,
      };
    });
  };
  
  const radarData = prepareRadarData();

  if (isLoadingProgress || isLoadingPredictions || isLoadingGaps) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!skillProgress || skillProgress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skill Progression</CardTitle>
          <CardDescription>
            Track your skill development journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-slate-100 p-3">
                <LineChart className="h-6 w-6 text-slate-500" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">No skill data available</h3>
            <p className="text-muted-foreground">
              Complete training programs and assessments to start tracking your skill progression.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Skill Progression Tracker</CardTitle>
            <CardDescription>
              Track and visualize your skill development journey
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right mr-2">
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="text-2xl font-bold">{userLevel}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {userLevel}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">
              <LineChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <Lightbulb className="h-4 w-4 mr-2" />
              Growth Predictions
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* XP Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium">Experience Points</h3>
                    <p className="text-sm text-muted-foreground">Level up by completing activities</p>
                  </div>
                  <div className="text-right">
                    <span className="text-md font-bold">{totalXP} XP</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={progressToNextLevel} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Level {userLevel}</span>
                    <span>{progressToNextLevel}% to Level {userLevel + 1}</span>
                  </div>
                </div>
              </div>
              
              {/* Skill Level Chart */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Current & Predicted Skill Levels</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                      barSize={isMobile ? 20 : 30}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        tick={{ fontSize: 12 }}
                        height={70}
                      />
                      <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                      <Tooltip
                        formatter={(value, name) => {
                          return [value, name === "currentLevel" 
                            ? "Current Level" 
                            : name === "predictedLevel" 
                              ? "Predicted Level" 
                              : "Required Level"
                          ];
                        }}
                        labelFormatter={(label) => `Skill: ${label}`}
                      />
                      <Legend 
                        formatter={(value) => {
                          return value === "currentLevel" 
                            ? "Current Level" 
                            : value === "predictedLevel" 
                              ? "Predicted Level" 
                              : "Required Level";
                        }}
                      />
                      <Bar 
                        dataKey="currentLevel" 
                        name="currentLevel" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="predictedLevel" 
                        name="predictedLevel" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="requiredLevel" 
                        name="requiredLevel" 
                        fill="#d1d5db" 
                        radius={[4, 4, 0, 0]} 
                        opacity={0.4} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Category Radar Chart */}
              <div className="mt-8">
                <h3 className="font-medium mb-3">Skill Category Overview</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis domain={[0, 5]} />
                      <Radar
                        name="Current Level"
                        dataKey="currentLevel"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                      />
                      <Radar
                        name="Predicted Level"
                        dataKey="predictedLevel"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="space-y-4">
              {achievements.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-blue-800">Total Achievements</h3>
                        <div className="bg-blue-100 p-1.5 rounded-full">
                          <Award className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 mt-1">{achievements.length}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-purple-800">Total XP Earned</h3>
                        <div className="bg-purple-100 p-1.5 rounded-full">
                          <Zap className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 mt-1">{totalXP} XP</p>
                    </div>
                  </div>
                  
                  <h3 className="font-medium mb-2">Your Achievements</h3>
                  <div className="space-y-3">
                    {achievements.map((achievement) => (
                      <div 
                        key={achievement.id} 
                        className={`p-3 rounded-lg border ${achievementTypes[achievement.type as keyof typeof achievementTypes].className}`}
                      >
                        <div className="flex items-start">
                          <div className="bg-white rounded-full p-2 mr-3 shadow-sm">
                            {achievementTypes[achievement.type as keyof typeof achievementTypes].icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{achievement.title}</h4>
                              <span className="text-sm font-medium">{achievement.xp} XP</span>
                            </div>
                            <p className="text-sm mt-1">{achievement.description}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-muted-foreground">Earned {achievement.date}</span>
                              <Badge variant="outline" className={achievementTypes[achievement.type as keyof typeof achievementTypes].className}>
                                {achievement.type.charAt(0).toUpperCase() + achievement.type.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-slate-100 p-3">
                      <Trophy className="h-6 w-6 text-slate-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No achievements yet</h3>
                  <p className="text-muted-foreground">
                    Complete more activities to earn achievements and gain XP.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Predictions Tab */}
          <TabsContent value="predictions">
            {skillPredictions && skillPredictions.length > 0 ? (
              <div className="space-y-6">
                <h3 className="font-medium">Growth Predictions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI-powered predictions based on your learning activities and progress
                </p>
                
                <div className="space-y-4">
                  {skillPredictions.map((prediction: any) => {
                    const growthPotentialPercent = Math.round(prediction.growthPotential * 100);
                    const confidencePercent = Math.round(prediction.confidenceScore * 100);
                    
                    return (
                      <div
                        key={prediction.skillSetId}
                        className="border rounded-lg p-4 hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{prediction.skillName}</h4>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className={levelColors[prediction.currentLevel as keyof typeof levelColors]}>
                                Current: Level {prediction.currentLevel}
                              </Badge>
                              <ArrowRight className="h-3.5 w-3.5 mx-2 text-muted-foreground" />
                              <Badge variant="outline" className={levelColors[Math.min(5, Math.ceil(prediction.predictedLevel)) as keyof typeof levelColors]}>
                                Predicted: Level {prediction.predictedLevel.toFixed(1)}
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline" className={
                            growthPotentialPercent >= 75 ? "bg-green-100 text-green-800 border-green-200" :
                            growthPotentialPercent >= 50 ? "bg-blue-100 text-blue-800 border-blue-200" :
                            "bg-amber-100 text-amber-800 border-amber-200"
                          }>
                            {growthPotentialPercent}% Growth Potential
                          </Badge>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Time to next level:</span>
                            <span className="font-medium">{prediction.timeToNextLevel} weeks</span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Prediction confidence:</span>
                            <span className="font-medium">{confidencePercent}%</span>
                          </div>
                        </div>
                        
                        {prediction.recommendedActions && prediction.recommendedActions.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium mb-2">Recommended Actions:</h5>
                            <ul className="space-y-1">
                              {prediction.recommendedActions.map((action: string, idx: number) => (
                                <li key={idx} className="text-sm flex items-start">
                                  <div className="bg-blue-100 rounded-full p-0.5 mr-2 mt-0.5">
                                    <Lightbulb className="h-3 w-3 text-blue-700" />
                                  </div>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-slate-100 p-3">
                    <BarChart3 className="h-6 w-6 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">No predictions available</h3>
                <p className="text-muted-foreground">
                  Complete more training activities to receive AI-powered growth predictions.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}