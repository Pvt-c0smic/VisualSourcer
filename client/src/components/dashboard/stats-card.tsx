import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "primary" | "accent" | "success" | "warning";
  viewAllLink?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "primary",
  viewAllLink,
  className,
}: StatsCardProps) {
  const colorClasses = {
    primary: "bg-primary-light dark:bg-primary text-white",
    accent: "bg-accent dark:bg-accent-dark text-white",
    success: "bg-green-700 text-white",
    warning: "bg-orange-600 text-white",
  };

  return (
    <Card className={cn("overflow-hidden shadow", className)}>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-dark dark:text-neutral-light truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-neutral-darkest dark:text-white">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {viewAllLink && (
        <CardFooter className="bg-neutral-light dark:bg-neutral-darkest px-5 py-3">
          <div className="text-sm">
            <Link href={viewAllLink}>
              <a className="font-medium text-primary hover:text-primary-dark dark:text-primary-light">
                View all
              </a>
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
