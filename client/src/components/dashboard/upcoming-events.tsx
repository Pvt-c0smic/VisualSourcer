import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarEvent } from "@shared/types";
import { Button } from "@/components/ui/button";
import { formatTime, formatDate } from "@/lib/utils";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface UpcomingEventsProps {
  className?: string;
}

export function UpcomingEvents({ className }: UpcomingEventsProps) {
  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/events"],
  });

  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  // Take only upcoming events (limit to 5)
  const upcomingEvents = sortedEvents.filter(
    (event) => new Date(event.start) >= new Date()
  ).slice(0, 5);

  const getBadgeVariant = (venueType: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (venueType) {
      case "VTC":
        return "outline";
      case "Face-to-Face":
        return "default";
      case "Required":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getEventMonthDay = (date: string) => {
    const eventDate = new Date(date);
    return {
      month: eventDate.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: eventDate.getDate()
    };
  };

  return (
    <Card className={className}>
      <CardHeader className="px-4 py-5 border-b border-neutral-light dark:border-neutral-darkest">
        <CardTitle className="text-lg font-medium text-neutral-darkest dark:text-white">
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 overflow-y-auto max-h-[600px]">
        <ul className="divide-y divide-neutral-light dark:divide-neutral-darkest">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => {
              const { month, day } = getEventMonthDay(event.start);
              
              return (
                <li key={event.id} className="py-4 flex">
                  <div className="flex-shrink-0 mr-4 flex flex-col items-center">
                    <span className="text-sm font-medium text-neutral-dark dark:text-neutral-light">{month}</span>
                    <span className="text-2xl font-bold text-neutral-darkest dark:text-white">{day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-darkest dark:text-white truncate">
                      {event.title}
                    </p>
                    <div className="mt-1 flex items-center text-xs text-neutral-dark dark:text-neutral-light">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                    <div className="mt-1 flex items-center text-xs text-neutral-dark dark:text-neutral-light">
                      <MapPin className="mr-1 h-3 w-3" />
                      {event.location}
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      {event.venueType && (
                        <Badge variant={getBadgeVariant(event.venueType)} className="text-xs">
                          {event.venueType}
                        </Badge>
                      )}
                      {event.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-neutral-dark dark:text-neutral-light hover:text-primary dark:hover:text-primary-light h-8 w-8"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </Button>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="py-6 text-center text-neutral-dark dark:text-neutral-light">
              No upcoming events
            </li>
          )}
        </ul>
      </CardContent>
      <CardFooter className="border-t border-neutral-light dark:border-neutral-darkest px-4 py-4">
        <div className="flex justify-between w-full">
          <Link href="/events">
            <a className="text-sm font-medium text-primary hover:text-primary-dark">
              View all events
            </a>
          </Link>
          <Link href="/create-event">
            <a>
              <Button size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-2" /> Add Event
              </Button>
            </a>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
