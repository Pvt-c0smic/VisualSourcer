import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Download } from "lucide-react";

// Mock data for analytics components
// This would be replaced with actual API calls in a real implementation
const trainingCompletionData = [
  { month: "Jan", completed: 18, enrolled: 25 },
  { month: "Feb", completed: 22, enrolled: 30 },
  { month: "Mar", completed: 25, enrolled: 35 },
  { month: "Apr", completed: 30, enrolled: 40 },
  { month: "May", completed: 35, enrolled: 45 },
  { month: "Jun", completed: 40, enrolled: 50 },
];

const skillDistributionData = [
  { name: "Cybersecurity", value: 35 },
  { name: "IT Infrastructure", value: 25 },
  { name: "Leadership", value: 20 },
  { name: "Networking", value: 15 },
  { name: "Communication", value: 5 },
];

const trainingMethodsData = [
  { name: "Face-to-Face", value: 60 },
  { name: "VTC", value: 40 },
];

const performanceData = [
  { name: "Team Alpha", score: 78 },
  { name: "Team Bravo", score: 85 },
  { name: "Team Charlie", score: 92 },
  { name: "Team Delta", score: 88 },
  { name: "Team Echo", score: 76 },
];

const monthlyEnrollmentData = [
  { month: "Jan", trainees: 25 },
  { month: "Feb", trainees: 30 },
  { month: "Mar", trainees: 35 },
  { month: "Apr", trainees: 28 },
  { month: "May", trainees: 42 },
  { month: "Jun", trainees: 48 },
];

// Colors for charts
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("6months");
  
  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-darkest dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-neutral-dark dark:text-neutral-light">
              Training metrics and performance insights
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <MetricCard
            title="Total Training Programs"
            value="18"
            change="+3"
            trend="up"
            label="from last month"
          />
          <MetricCard
            title="Active Trainees"
            value="245"
            change="+28"
            trend="up"
            label="from last month"
          />
          <MetricCard
            title="Completion Rate"
            value="87%"
            change="+5%"
            trend="up"
            label="from last month"
          />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Training Completion Trends</CardTitle>
                  <CardDescription>
                    Completion rates over the past 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={trainingCompletionData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="enrolled" name="Enrolled" fill="hsl(var(--chart-1))" />
                        <Bar dataKey="completed" name="Completed" fill="hsl(var(--chart-2))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Skill Distribution</CardTitle>
                  <CardDescription>
                    Distribution of training by skill category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={skillDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {skillDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Training Methods</CardTitle>
                  <CardDescription>
                    Distribution of training methods (VTC vs Face-to-Face)
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-60 w-full max-w-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trainingMethodsData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="hsl(var(--chart-3))" />
                          <Cell fill="hsl(var(--chart-4))" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                  <CardDescription>
                    Average performance scores by team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={performanceData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="score" fill="hsl(var(--chart-5))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="enrollment">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Enrollment Trends</CardTitle>
                  <CardDescription>
                    Number of trainees enrolled each month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyEnrollmentData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="trainees"
                          name="Enrolled Trainees"
                          stroke="hsl(var(--chart-1))"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Popular Programs</CardTitle>
                    <CardDescription>Most enrolled training programs</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ol className="list-decimal pl-5 space-y-2">
                      <li className="text-sm">Network Security Fundamentals (45 trainees)</li>
                      <li className="text-sm">Leadership and Management (38 trainees)</li>
                      <li className="text-sm">Server Administration (32 trainees)</li>
                      <li className="text-sm">Cybersecurity Workshop (28 trainees)</li>
                      <li className="text-sm">Information Systems Overview (22 trainees)</li>
                    </ol>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Enrollment by Unit</CardTitle>
                    <CardDescription>Distribution across units</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ul className="space-y-2">
                      <li className="flex justify-between text-sm">
                        <span>42nd Battalion</span>
                        <span className="font-semibold">32%</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span>Signal Corps</span>
                        <span className="font-semibold">28%</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span>Cyber Defense</span>
                        <span className="font-semibold">22%</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span>Support Services</span>
                        <span className="font-semibold">12%</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span>Other Units</span>
                        <span className="font-semibold">6%</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Enrollment Growth</CardTitle>
                    <CardDescription>Month-over-month changes</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ul className="space-y-2">
                      <li className="flex justify-between text-sm">
                        <span>Feb vs Jan</span>
                        <span className="font-semibold text-green-600">+20%</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span>Mar vs Feb</span>
                        <span className="font-semibold text-green-600">+16.7%</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span>Apr vs Mar</span>
                        <span className="font-semibold text-red-600">-20%</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span>May vs Apr</span>
                        <span className="font-semibold text-green-600">+50%</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span>Jun vs May</span>
                        <span className="font-semibold text-green-600">+14.3%</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="completion">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completion Rates by Program Category</CardTitle>
                  <CardDescription>
                    Percentage of trainees who complete each type of program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { category: "Cybersecurity", rate: 85 },
                          { category: "IT Infrastructure", rate: 78 },
                          { category: "Leadership", rate: 92 },
                          { category: "Networking", rate: 82 },
                          { category: "Communication", rate: 95 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, "Completion Rate"]} />
                        <Bar dataKey="rate" name="Completion Rate (%)" fill="hsl(var(--chart-3))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Time to Completion</CardTitle>
                    <CardDescription>
                      Average time taken to complete training programs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { program: "Network Security", days: 14 },
                            { program: "Leadership", days: 7 },
                            { program: "Server Admin", days: 21 },
                            { program: "Cybersecurity", days: 10 },
                            { program: "Info Systems", days: 5 },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="program" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="days" name="Days" fill="hsl(var(--chart-2))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Certificates Issued</CardTitle>
                    <CardDescription>
                      Trend of certificates issued by month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { month: "Jan", certificates: 15 },
                            { month: "Feb", certificates: 22 },
                            { month: "Mar", certificates: 25 },
                            { month: "Apr", certificates: 30 },
                            { month: "May", certificates: 35 },
                            { month: "Jun", certificates: 40 },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="certificates"
                            stroke="hsl(var(--chart-5))"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Score Distribution</CardTitle>
                  <CardDescription>
                    Distribution of test scores across all trainees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { score: "90-100", count: 45 },
                          { score: "80-89", count: 82 },
                          { score: "70-79", count: 68 },
                          { score: "60-69", count: 32 },
                          { score: "Below 60", count: 18 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="score" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" name="Trainees" fill="hsl(var(--chart-4))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>
                      Trainees with highest average scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                            JD
                          </div>
                          <div>
                            <p className="font-medium">John Doe</p>
                            <p className="text-sm text-neutral-dark dark:text-neutral-light">Cyber Defense</p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">98%</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white mr-3">
                            JS
                          </div>
                          <div>
                            <p className="font-medium">Jane Smith</p>
                            <p className="text-sm text-neutral-dark dark:text-neutral-light">Signal Corps</p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">96%</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white mr-3">
                            RJ
                          </div>
                          <div>
                            <p className="font-medium">Robert Johnson</p>
                            <p className="text-sm text-neutral-dark dark:text-neutral-light">42nd Battalion</p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">95%</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white mr-3">
                            ML
                          </div>
                          <div>
                            <p className="font-medium">Mary Lewis</p>
                            <p className="text-sm text-neutral-dark dark:text-neutral-light">Cyber Defense</p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">94%</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-white mr-3">
                            DW
                          </div>
                          <div>
                            <p className="font-medium">David Williams</p>
                            <p className="text-sm text-neutral-dark dark:text-neutral-light">Signal Corps</p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">93%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Venue Type</CardTitle>
                    <CardDescription>
                      Average scores comparing VTC vs Face-to-Face training
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { 
                              category: "Cybersecurity", 
                              faceFace: 85, 
                              vtc: 78 
                            },
                            { 
                              category: "IT Infrastructure", 
                              faceFace: 82, 
                              vtc: 75 
                            },
                            { 
                              category: "Leadership", 
                              faceFace: 92, 
                              vtc: 85 
                            },
                            { 
                              category: "Networking", 
                              faceFace: 88, 
                              vtc: 80 
                            },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, ""]} />
                          <Legend />
                          <Bar dataKey="faceFace" name="Face-to-Face" fill="hsl(var(--chart-1))" />
                          <Bar dataKey="vtc" name="VTC" fill="hsl(var(--chart-2))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// Metric card component for top stats
interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  label: string;
}

function MetricCard({ title, value, change, trend, label }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-dark dark:text-neutral-light">
              {title}
            </p>
            <p className="text-3xl font-bold mt-2 text-neutral-darkest dark:text-white">
              {value}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <div
            className={`text-sm font-medium ${
              trend === "up" ? "text-green-700" : "text-red-600"
            }`}
          >
            {change}{" "}
            {trend === "up" ? (
              <span className="inline-block">↑</span>
            ) : (
              <span className="inline-block">↓</span>
            )}
          </div>
          <div className="text-sm text-neutral-dark dark:text-neutral-light ml-2">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
