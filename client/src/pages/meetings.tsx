import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PlusCircle, Calendar, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Meeting } from "@shared/types";

export default function Meetings() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  // Filter meetings based on search query
  const filteredMeetings = meetings.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-darkest dark:text-white">
              Meetings
            </h1>
            <p className="text-neutral-dark dark:text-neutral-light">
              Schedule and manage meetings with stakeholders
            </p>
          </div>
          <Link href="/create-meeting">
            <Button className="inline-flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Meeting
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-dark dark:text-neutral-light" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>
              View and manage your scheduled meetings with stakeholders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetings.length > 0 ? (
                  filteredMeetings.map((meeting) => (
                    <TableRow key={meeting.id}>
                      <TableCell className="font-medium">
                        {meeting.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-neutral-dark dark:text-neutral-light" />
                          <div>
                            <div>{formatDate(meeting.startTime)}</div>
                            <div className="text-xs text-neutral-dark dark:text-neutral-light">
                              {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{meeting.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-neutral-dark dark:text-neutral-light" />
                          <span>{meeting.participants.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={meeting.type === "VTC" ? "outline" : "secondary"}
                          className={
                            meeting.type === "VTC"
                              ? "text-orange-600 dark:text-orange-500"
                              : ""
                          }
                        >
                          {meeting.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            meeting.status === "Scheduled"
                              ? "text-green-700 dark:text-green-500"
                              : meeting.status === "Pending"
                              ? "text-orange-600 dark:text-orange-500"
                              : "text-neutral-dark dark:text-neutral-light"
                          }
                        >
                          {meeting.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No meetings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-neutral-dark dark:text-neutral-light">
              Showing {filteredMeetings.length} of {meetings.length} meetings
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
