import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Calendar } from "@/components/dashboard/calendar";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { TrainingProgramsTable } from "@/components/dashboard/training-programs-table";
import { Users, BookOpen, IdCard, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@shared/types";

export default function Dashboard() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-darkest dark:text-white">
            Dashboard
          </h1>
          <p className="text-neutral-dark dark:text-neutral-light">
            Welcome back, training management is now easier.
          </p>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Active Trainees"
            value={stats?.activeTrainees || 0}
            icon={Users}
            color="primary"
            viewAllLink="/users?filter=trainees"
          />
          <StatsCard
            title="Active Programs"
            value={stats?.activePrograms || 0}
            icon={BookOpen}
            color="accent"
            viewAllLink="/training-programs"
          />
          <StatsCard
            title="Certificates Issued"
            value={stats?.certificatesIssued || 0}
            icon={IdCard}
            color="success"
            viewAllLink="/certificates"
          />
          <StatsCard
            title="Upcoming Meetings"
            value={stats?.upcomingMeetings || 0}
            icon={CalendarIcon}
            color="warning"
            viewAllLink="/meetings"
          />
        </div>

        {/* Calendar and Upcoming Events */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Calendar className="lg:col-span-2" />
          <UpcomingEvents className="lg:col-span-1" />
        </div>

        {/* Training Programs */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-darkest dark:text-white">
              Current Training Programs
            </h2>
            <Link href="/create-program">
              <Button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none">
                <Plus className="h-4 w-4 mr-2" /> New Program
              </Button>
            </Link>
          </div>

          <TrainingProgramsTable limit={3} />
        </div>
      </div>
    </MainLayout>
  );
}
