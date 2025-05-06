import { MainLayout } from "@/components/layout/main-layout";
import { Calendar } from "@/components/dashboard/calendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Schedules() {
  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-darkest dark:text-white">
              Schedules
            </h1>
            <p className="text-neutral-dark dark:text-neutral-light">
              Manage training schedules and events
            </p>
          </div>
          <Button className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="recurring">Recurring Events</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>View and manage your schedule in a calendar format</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Event List</CardTitle>
                <CardDescription>View your schedule as a chronological list</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-neutral-dark dark:text-neutral-light">
                  Event list view coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recurring">
            <Card>
              <CardHeader>
                <CardTitle>Recurring Events</CardTitle>
                <CardDescription>Manage events that occur on a regular schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-neutral-dark dark:text-neutral-light">
                  Recurring events management coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
