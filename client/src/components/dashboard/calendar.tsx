import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatDate, getMonthName, generateCalendarDays } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CalendarEvent } from "@shared/types";

interface CalendarProps {
  className?: string;
}

export function Calendar({ className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = generateCalendarDays(year, month);

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/events"],
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Function to get events for a specific day
  const getEventsForDay = (day: number, isCurrentMonth: boolean): CalendarEvent[] => {
    if (!isCurrentMonth) return [];
    
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  // Function to determine event color class based on event type
  const getEventColorClass = (eventType: string): string => {
    switch (eventType) {
      case "training":
        return "bg-primary bg-opacity-20 dark:bg-opacity-30 text-primary-dark dark:text-primary-light border-l-2 border-primary";
      case "meeting":
        return "bg-accent bg-opacity-20 dark:bg-opacity-30 text-accent-dark dark:text-accent border-l-2 border-accent";
      case "ceremony":
        return "bg-green-700 bg-opacity-20 dark:bg-opacity-30 text-green-700 dark:text-green-500 border-l-2 border-green-700";
      case "workshop":
        return "bg-orange-600 bg-opacity-20 dark:bg-opacity-30 text-orange-600 dark:text-orange-500 border-l-2 border-orange-600";
      default:
        return "bg-neutral-medium bg-opacity-20 dark:bg-opacity-30 text-neutral-dark dark:text-neutral-light border-l-2 border-neutral-medium";
    }
  };

  return (
    <div className={cn("bg-white dark:bg-neutral-dark shadow rounded-lg", className)}>
      <div className="px-4 py-5 border-b border-neutral-light dark:border-neutral-darkest sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-neutral-darkest dark:text-white">
            Training Schedule
          </h3>
          <div className="flex space-x-3">
            <Button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Schedule
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-dark dark:text-neutral-light hover:text-primary dark:hover:text-primary-light"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-neutral-darkest dark:text-white">
              {getMonthName(month)} {year}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-dark dark:text-neutral-light hover:text-primary dark:hover:text-primary-light"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-sm text-neutral-dark dark:text-neutral-light hover:text-primary dark:hover:text-primary-light"
              onClick={goToToday}
            >
              Today
            </Button>
            <Select
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "month" | "week" | "day")}
            >
              <SelectTrigger className="w-24 text-sm">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-neutral-light dark:bg-neutral-dark rounded-lg overflow-hidden shadow">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <div
              key={`header-${i}`}
              className="bg-neutral-light dark:bg-neutral-darkest h-10 flex items-center justify-center font-medium text-neutral-dark dark:text-neutral-light"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, i) => {
            const dayEvents = getEventsForDay(day.date, day.currentMonth);
            const isToday =
              day.currentMonth &&
              new Date().getDate() === day.date &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${i}`}
                className={cn(
                  "h-28 p-1 relative",
                  day.currentMonth
                    ? isToday
                      ? "bg-neutral-lightest dark:bg-neutral-darkest"
                      : "bg-white dark:bg-neutral-dark"
                    : "bg-white dark:bg-neutral-dark text-neutral-medium dark:text-neutral-medium"
                )}
              >
                <span className={cn("text-sm", isToday && "font-medium")}>
                  {day.date}
                </span>
                <div className="mt-1 overflow-y-auto max-h-20">
                  {dayEvents.map((event, j) => (
                    <div
                      key={`event-${j}`}
                      className={cn(
                        "px-1 py-1 text-xs rounded mb-1 truncate",
                        getEventColorClass(event.type)
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
