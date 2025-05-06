import { MainLayout } from "@/components/layout/main-layout";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Program, User } from "@shared/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  ArrowLeft, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  BarChart, 
  FileText, 
  Award, 
  BookOpen 
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function ProgramDetails() {
  const { id } = useParams();
  
  const { data: program, isLoading } = useQuery<Program>({
    queryKey: [`/api/programs/${id}`],
  });

  const { data: enrollees = [] } = useQuery<User[]>({
    queryKey: [`/api/programs/${id}/enrollees`],
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!program) {
    return (
      <MainLayout>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-neutral-darkest dark:text-white mb-2">
              Program Not Found
            </h2>
            <p className="text-neutral-dark dark:text-neutral-light mb-4">
              The program you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/training-programs">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Programs
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <Link href="/training-programs">
                <a className="text-neutral-dark dark:text-neutral-light hover:text-primary mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </a>
              </Link>
              <h1 className="text-2xl font-semibold text-neutral-darkest dark:text-white">
                {program.name}
              </h1>
              <Badge 
                variant="outline" 
                className={
                  program.status === "Open" 
                    ? "text-green-700 dark:text-green-500 ml-2" 
                    : "text-orange-600 dark:text-orange-500 ml-2"
                }
              >
                {program.status}
              </Badge>
            </div>
            <p className="text-neutral-dark dark:text-neutral-light">
              {program.code} • {program.skillSetCategory} • Level {program.skillSetLevel}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Enrollees
            </Button>
            <Link href={`/program/${id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Program
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-neutral-dark dark:text-neutral-light">Enrolled</p>
                  <p className="text-2xl font-semibold text-neutral-darkest dark:text-white">
                    {program.enrolledCount}/{program.capacity}
                  </p>
                </div>
                <Users className="h-10 w-10 text-primary" />
              </div>
              <Progress 
                value={(program.enrolledCount / program.capacity) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-neutral-dark dark:text-neutral-light">Duration</p>
                  <p className="text-2xl font-semibold text-neutral-darkest dark:text-white">
                    {program.duration}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-accent" />
              </div>
              <div className="flex items-center mt-2 text-sm text-neutral-dark dark:text-neutral-light">
                <Calendar className="h-4 w-4 mr-1" />
                Starting {formatDate(program.startDate)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-neutral-dark dark:text-neutral-light">Venue</p>
                  <p className="text-2xl font-semibold text-neutral-darkest dark:text-white">
                    {program.venue}
                  </p>
                </div>
                <MapPin className="h-10 w-10 text-orange-600" />
              </div>
              <div className="flex items-center mt-2 text-sm text-neutral-dark dark:text-neutral-light">
                {program.location || "Location details not specified"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Program Details</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="enrollees">Enrollees</TabsTrigger>
            <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
                <CardDescription>Detailed information about the training program</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-darkest dark:text-white mb-2">
                    Description
                  </h3>
                  <p className="text-neutral-dark dark:text-neutral-light">
                    {program.description || "No description provided"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-neutral-darkest dark:text-white mb-2">
                    Objectives
                  </h3>
                  <ul className="list-disc pl-5 text-neutral-dark dark:text-neutral-light">
                    {program.objectives?.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    )) || <li>No objectives specified</li>}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-neutral-darkest dark:text-white mb-2">
                    Prerequisites
                  </h3>
                  <ul className="list-disc pl-5 text-neutral-dark dark:text-neutral-light">
                    {program.prerequisites?.map((prerequisite, index) => (
                      <li key={index}>{prerequisite}</li>
                    )) || <li>No prerequisites required</li>}
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-darkest dark:text-white mb-2">
                      Program Details
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex">
                        <dt className="w-1/3 text-neutral-dark dark:text-neutral-light">Created By:</dt>
                        <dd className="w-2/3 font-medium text-neutral-darkest dark:text-white">{program.createdBy}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-1/3 text-neutral-dark dark:text-neutral-light">Created Date:</dt>
                        <dd className="w-2/3 font-medium text-neutral-darkest dark:text-white">{formatDate(program.createdAt)}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-1/3 text-neutral-dark dark:text-neutral-light">Last Updated:</dt>
                        <dd className="w-2/3 font-medium text-neutral-darkest dark:text-white">{formatDate(program.updatedAt)}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-neutral-darkest dark:text-white mb-2">
                      Certification
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex">
                        <dt className="w-1/3 text-neutral-dark dark:text-neutral-light">Certificate:</dt>
                        <dd className="w-2/3 font-medium text-neutral-darkest dark:text-white">
                          {program.certificateTitle || "Standard Completion Certificate"}
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="w-1/3 text-neutral-dark dark:text-neutral-light">Required Score:</dt>
                        <dd className="w-2/3 font-medium text-neutral-darkest dark:text-white">
                          {program.passingScore || "70"}%
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="curriculum">
            <Card>
              <CardHeader>
                <CardTitle>Program Curriculum</CardTitle>
                <CardDescription>Program of Instruction (POI) content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-neutral-dark dark:text-neutral-light">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-neutral-medium" />
                  <h3 className="text-lg font-medium text-neutral-darkest dark:text-white">
                    Program of Instruction
                  </h3>
                  <p className="mb-4">Content is being prepared by the instructor</p>
                  <Button variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Create POI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="enrollees">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Personnel</CardTitle>
                <CardDescription>
                  Manage personnel enrolled in this training program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Enrolled Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollees.length > 0 ? (
                      enrollees.map((enrollee) => (
                        <TableRow key={enrollee.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {enrollee.avatarUrl ? (
                                  <AvatarImage src={enrollee.avatarUrl} alt={enrollee.name} />
                                ) : null}
                                <AvatarFallback>
                                  {enrollee.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-neutral-darkest dark:text-white">
                                  {enrollee.name}
                                </p>
                                <p className="text-xs text-neutral-dark dark:text-neutral-light">
                                  {enrollee.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{enrollee.rank || "N/A"}</TableCell>
                          <TableCell>{enrollee.unit || "N/A"}</TableCell>
                          <TableCell>{formatDate(enrollee.enrollmentDate)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                enrollee.enrollmentStatus === "Active" 
                                  ? "text-green-700 dark:text-green-500" 
                                  : "text-orange-600 dark:text-orange-500"
                              }
                            >
                              {enrollee.enrollmentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={enrollee.progress || 0} className="w-24" />
                              <span className="text-xs">{enrollee.progress || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6">
                          No enrollees found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>Track completion rates and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-neutral-dark dark:text-neutral-light">
                  <BarChart className="h-12 w-12 mx-auto mb-2 text-neutral-medium" />
                  <h3 className="text-lg font-medium text-neutral-darkest dark:text-white">
                    Progress Data
                  </h3>
                  <p className="mb-4">Progress tracking will be available after the program starts</p>
                  <Badge variant="outline">
                    Starting {formatDate(program.startDate)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
