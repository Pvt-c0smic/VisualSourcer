import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Program } from "@shared/types";
import { cn, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Server,
  Users,
  Edit,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrainingProgramsTableProps {
  className?: string;
  limit?: number;
}

export function TrainingProgramsTable({
  className,
  limit,
}: TrainingProgramsTableProps) {
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  // Limit the number of programs if specified
  const displayedPrograms = limit ? programs.slice(0, limit) : programs;

  const getProgramIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "cybersecurity":
        return <Shield className="h-5 w-5" />;
      case "it infrastructure":
        return <Server className="h-5 w-5" />;
      case "leadership":
        return <Users className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getProgramIconClass = (category: string) => {
    switch (category.toLowerCase()) {
      case "cybersecurity":
        return "bg-primary bg-opacity-20 dark:bg-opacity-30 text-primary-dark dark:text-primary-light";
      case "it infrastructure":
        return "bg-accent bg-opacity-20 dark:bg-opacity-30 text-accent-dark dark:text-accent";
      case "leadership":
        return "bg-orange-600 bg-opacity-20 dark:bg-opacity-30 text-orange-600 dark:text-orange-500";
      default:
        return "bg-neutral-medium bg-opacity-20 dark:bg-opacity-30 text-neutral-dark dark:text-neutral-light";
    }
  };

  const getVenueBadge = (venue: string) => {
    return venue === "VTC" ? (
      <Badge variant="outline" className="text-orange-600 dark:text-orange-500">
        VTC
      </Badge>
    ) : (
      <Badge variant="outline" className="text-green-700 dark:text-green-500">
        Face-to-Face
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return (
          <Badge variant="outline" className="text-green-700 dark:text-green-500">
            Open
          </Badge>
        );
      case "full":
        return (
          <Badge variant="outline" className="text-orange-600 dark:text-orange-500">
            Full
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="text-neutral-dark dark:text-neutral-light">
            Completed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-neutral-dark dark:text-neutral-light">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className={cn("bg-white dark:bg-neutral-dark shadow overflow-hidden rounded-lg", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-light dark:bg-neutral-darkest">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-dark dark:text-neutral-light uppercase tracking-wider">
                Program Name
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-dark dark:text-neutral-light uppercase tracking-wider">
                Skill Set
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-dark dark:text-neutral-light uppercase tracking-wider">
                Start Date
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-dark dark:text-neutral-light uppercase tracking-wider">
                Duration
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-dark dark:text-neutral-light uppercase tracking-wider">
                Venue
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-dark dark:text-neutral-light uppercase tracking-wider">
                Enrolled
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-dark dark:text-neutral-light uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedPrograms.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md",
                        getProgramIconClass(program.skillSetCategory)
                      )}
                    >
                      {getProgramIcon(program.skillSetCategory)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-neutral-darkest dark:text-white">
                        {program.name}
                      </div>
                      <div className="text-xs text-neutral-dark dark:text-neutral-light">
                        {program.code}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-darkest dark:text-white">
                    {program.skillSetCategory}
                  </div>
                  <div className="text-xs text-neutral-dark dark:text-neutral-light">
                    Level {program.skillSetLevel}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-darkest dark:text-white">
                    {formatDate(program.startDate)}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-darkest dark:text-white">
                    {program.duration}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  {getVenueBadge(program.venue)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darkest dark:text-white">
                  {program.enrolledCount}/{program.capacity}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(program.status)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/program/${program.id}/edit`}>
                    <a className="text-primary hover:text-primary-dark dark:text-primary-light mr-3">
                      <Edit className="h-4 w-4" />
                    </a>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90 h-8 w-8"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-6 py-4 border-t border-neutral-light dark:border-neutral-darkest bg-neutral-light dark:bg-neutral-darkest">
        <div className="flex justify-between items-center">
          <div className="text-sm text-neutral-dark dark:text-neutral-light">
            Showing <span className="font-medium">1</span> to{" "}
            <span className="font-medium">{displayedPrograms.length}</span> of{" "}
            <span className="font-medium">{programs.length}</span> programs
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={displayedPrograms.length === 0}
              className="h-8"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={displayedPrograms.length === programs.length}
              className="h-8"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
