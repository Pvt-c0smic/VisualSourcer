import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, Info, Download, Calendar, Users, Award, Target, BarChart2, PieChart as PieChartIcon, Layers, ListFilter } from "lucide-react";
import SkillProgression from "@/components/analytics/skill-progression";

// Colors for pie chart
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];

export default function SkillsAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30days");
  const [userId, setUserId] = useState<number | null>(null);
  
  // Fetch current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  
  // Set current user ID when data loads
  if (currentUser && !userId) {
    setUserId(currentUser.id);
  }
  
  // Fetch users for user selection (for admins/trainers)
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: currentUser?.role === 'admin' || currentUser?.role === 'trainer',
  });
  
  // Fetch enrollment stats based on time range
  const getDateRange = () => {
    const today = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case "7days":
        startDate.setDate(today.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(today.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(today.getDate() - 90);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };
  
  // Fetch enrollment statistics
  const { data: enrollmentStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/analytics/enrollment', getDateRange()],
    enabled: currentUser?.role === 'admin' || currentUser?.role === 'trainer',
  });
  
  // Fetch organization analytics for admins
  const { data: orgAnalytics, isLoading: isLoadingOrgAnalytics } = useQuery({
    queryKey: ['/api/analytics/organization'],
    enabled: currentUser?.role === 'admin',
  });
  
  // Format skill distribution data for pie chart
  const formatSkillDistribution = () => {
    if (!enrollmentStats?.skillDistribution) return [];
    
    return enrollmentStats.skillDistribution.map((item: any) => ({
      name: item.category,
      value: item.count
    }));
  };
  
  // Format popular programs data for bar chart
  const formatPopularPrograms = () => {
    if (!enrollmentStats?.popularPrograms) return [];
    
    return enrollmentStats.popularPrograms.map((program: any) => ({
      name: program.programName.length > 20 
        ? program.programName.substring(0, 20) + '...' 
        : program.programName,
      enrollments: program.enrollmentCount
    }));
  };
  
  const handleUserChange = (value: string) => {
    setUserId(parseInt(value));
  };
  
  const handleExportData = () => {
    // In a real app, this would generate and download a CSV/PDF report
    alert("Analytics data export functionality would be implemented here");
  };
  
  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view analytics.</p>
        </div>
      </div>
    );
  }
  
  const isAdmin = currentUser.role === 'admin';
  const isTrainer = currentUser.role === 'trainer';
  
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Skills Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track and analyze skill development with AI-powered insights
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {(isAdmin || isTrainer) && (
            <Button 
              variant="outline"
              className="gap-2"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4" /> Export Data
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="personal" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="personal">
              <Target className="h-4 w-4 mr-2" />
              Personal Analytics
            </TabsTrigger>
            {(isAdmin || isTrainer) && (
              <TabsTrigger value="organization">
                <BarChart2 className="h-4 w-4 mr-2" />
                Organization Metrics
              </TabsTrigger>
            )}
          </TabsList>
          
          {(isAdmin || isTrainer) && (
            <div className="flex gap-2 items-center">
              <Select onValueChange={handleUserChange} defaultValue={userId?.toString()}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {currentUser && <SelectItem value={currentUser.id.toString()}>Me ({currentUser.name})</SelectItem>}
                  {users && users.map((user: any) => (
                    user.id !== currentUser.id && (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <TabsContent value="personal">
          {userId && <SkillProgression userId={userId} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
                <CardDescription>
                  AI-generated recommendations based on your skill profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userId ? (
                  <PersonalizedRecommendations userId={userId} />
                ) : (
                  <div className="text-center py-6">
                    <p>Select a user to view recommendations</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Skill Gap Analysis</CardTitle>
                <CardDescription>
                  Identify and bridge gaps between current and required skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userId ? (
                  <SkillGapAnalysis userId={userId} />
                ) : (
                  <div className="text-center py-6">
                    <p>Select a user to view skill gap analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="organization">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Organization Performance</h2>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoadingStats || isLoadingOrgAnalytics ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard 
                  title="Training Enrollments"
                  value={enrollmentStats?.enrollments || 0}
                  icon={<Users className="h-5 w-5 text-blue-600" />}
                  description={`Total enrollments in selected period`}
                  color="blue"
                />
                <MetricCard 
                  title="Completion Rate"
                  value={`${Math.round((enrollmentStats?.completionRate || 0) * 100)}%`}
                  icon={<Award className="h-5 w-5 text-green-600" />}
                  description="Percentage of completed programs"
                  color="green"
                />
                <MetricCard 
                  title="Average Quiz Score"
                  value={`${Math.round(enrollmentStats?.averageQuizScore || 0)}%`}
                  icon={<Target className="h-5 w-5 text-amber-600" />}
                  description="Average assessment performance"
                  color="amber"
                />
                <MetricCard 
                  title="Total Users"
                  value={orgAnalytics?.usersByRole?.reduce((sum: number, role: any) => sum + role.count, 0) || 0}
                  icon={<Users className="h-5 w-5 text-purple-600" />}
                  description="Active users in the system"
                  color="purple"
                />
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
                      Popular Programs
                    </CardTitle>
                    <CardDescription>
                      Most enrolled training programs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={formatPopularPrograms()}
                          margin={{ top: 10, right: 10, left: -15, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="enrollments" fill="#3b82f6" name="Enrollments" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Skill Distribution
                    </CardTitle>
                    <CardDescription>
                      Training by skill categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formatSkillDistribution()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {formatSkillDistribution().map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Enrollments']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* User Role Distribution */}
              {orgAnalytics?.usersByRole && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-indigo-600" />
                      User Role Distribution
                    </CardTitle>
                    <CardDescription>
                      Breakdown of users by role
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {orgAnalytics.usersByRole.map((role: any) => (
                        <div key={role.role} className="bg-slate-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-slate-500 mb-1">
                            {role.role.charAt(0).toUpperCase() + role.role.slice(1).replace('_', ' ')}s
                          </h3>
                          <p className="text-2xl font-bold">{role.count}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon, description, color }: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  description: string; 
  color: 'blue' | 'green' | 'amber' | 'purple' | 'slate';
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      title: 'text-blue-800',
      value: 'text-blue-900'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      title: 'text-green-800',
      value: 'text-green-900'
    },
    amber: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      title: 'text-amber-800',
      value: 'text-amber-900'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      title: 'text-purple-800',
      value: 'text-purple-900'
    },
    slate: {
      bg: 'bg-slate-50',
      iconBg: 'bg-slate-100',
      title: 'text-slate-800',
      value: 'text-slate-900'
    }
  };
  
  const classes = colorClasses[color];
  
  return (
    <div className={`${classes.bg} p-4 rounded-lg`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-sm font-medium ${classes.title}`}>{title}</h3>
          <p className={`text-2xl font-bold ${classes.value} mt-1`}>{value}</p>
        </div>
        <div className={`${classes.iconBg} p-2 rounded-full`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

// Personalized Recommendations Component
function PersonalizedRecommendations({ userId }: { userId: number }) {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: [`/api/analytics/users/${userId}/recommendations`],
    enabled: !!userId,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!recommendations || !recommendations.recommendedPrograms) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No recommendations available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold mb-2">Recommended Programs</h3>
      
      <div className="space-y-3">
        {recommendations.recommendedPrograms.map((program: any, index: number) => (
          <div key={index} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex justify-between">
              <h4 className="font-medium">{program.name}</h4>
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                Match: {Math.round(program.matchScore * 100)}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{program.reasoning}</p>
          </div>
        ))}
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-2">
        <h3 className="text-md font-semibold">Skill Development Priorities</h3>
        <ul className="space-y-1 mt-2">
          {recommendations.skillPriorities.map((priority: string, idx: number) => (
            <li key={idx} className="text-sm flex gap-2 items-start">
              <div className="bg-green-100 text-green-800 rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <span>{priority}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <Separator className="my-4" />
      
      <div>
        <h3 className="text-md font-semibold mb-2">Career Development Advice</h3>
        <p className="text-sm">{recommendations.careerAdvice}</p>
      </div>
    </div>
  );
}

// Skill Gap Analysis Component
function SkillGapAnalysis({ userId }: { userId: number }) {
  const { data: gapAnalysis, isLoading } = useQuery({
    queryKey: [`/api/analytics/users/${userId}/skill-gaps`],
    enabled: !!userId,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!gapAnalysis || !gapAnalysis.skillGaps || gapAnalysis.skillGaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="bg-green-100 text-green-800 p-2 rounded-full mb-2">
          <Award className="h-5 w-5" />
        </div>
        <h3 className="font-medium">No Skill Gaps Detected</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your skills align well with the requirements
        </p>
      </div>
    );
  }
  
  // Prepare data for gap chart
  const gapChartData = gapAnalysis.skillGaps.map((gap: any) => ({
    name: gap.skillName,
    current: gap.currentLevel,
    required: gap.requiredLevel,
    gap: gap.gap
  }));
  
  return (
    <div className="space-y-4">
      <div className="h-[200px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={gapChartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 5]} />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip formatter={(value, name) => {
              return [value, name === "current" ? "Current Level" : name === "required" ? "Required Level" : "Gap"];
            }} />
            <Legend />
            <Bar dataKey="current" fill="#3b82f6" name="Current Level" />
            <Bar dataKey="required" fill="#d1d5db" name="Required Level" stackId="a" />
            <Bar dataKey="gap" fill="#ef4444" name="Gap" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <h3 className="text-md font-semibold mb-2">Recommended Training</h3>
      
      <div className="space-y-3">
        {gapAnalysis.skillGaps.map((gap: any) => (
          gap.recommendedPrograms && gap.recommendedPrograms.length > 0 && (
            <div key={gap.skillSetId} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{gap.skillName}</h4>
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                  Gap: {gap.gap} {gap.gap === 1 ? 'level' : 'levels'}
                </Badge>
              </div>
              
              <div className="mt-2 space-y-2">
                {gap.recommendedPrograms.map((program: any) => (
                  <div key={program.programId} className="pl-2 border-l-2 border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{program.programName}</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                        {Math.round(program.effectivenessScore * 100)}% effective
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}