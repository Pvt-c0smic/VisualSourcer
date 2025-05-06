import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { TrainingProgramsTable } from "@/components/dashboard/training-programs-table";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { PlusCircle, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TrainingPrograms() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [location] = useLocation();
  const { user } = useAuth();

  // Determine the page type based on the current location
  const isMyCourses = location === "/my-courses";
  const isAvailableTraining = location === "/available-training";

  // Set page title and description based on route
  let pageTitle = "Training Programs";
  let pageDescription = "Manage and organize all your training programs";
  let tableFilter = {};

  if (isMyCourses) {
    pageTitle = "My Courses";
    pageDescription = "View and access your enrolled training programs";
    tableFilter = { 
      // Filter for enrolled courses only
      enrolledOnly: true,
      userId: user?.id
    };
  } else if (isAvailableTraining) {
    pageTitle = "Available Training";
    pageDescription = "Browse and enroll in available training programs";
    tableFilter = { 
      // Filter for open courses only
      status: "Open",
      notEnrolled: true,
      userId: user?.id
    };
  }

  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-darkest dark:text-white">
              {pageTitle}
            </h1>
            <p className="text-neutral-dark dark:text-neutral-light">
              {pageDescription}
            </p>
          </div>
          {(user?.role === "admin" || user?.role === "trainer") && !isMyCourses && !isAvailableTraining && (
            <Link href="/create-program">
              <Button className="inline-flex items-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Program
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-dark rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-4">
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                  <SelectItem value="it_infrastructure">IT Infrastructure</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                </SelectContent>
              </Select>
              {!isAvailableTraining && (
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <TrainingProgramsTable 
          filter={tableFilter}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
        />
      </div>
    </MainLayout>
  );
}
