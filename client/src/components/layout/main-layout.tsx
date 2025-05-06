import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAuth } from "@/lib/auth.tsx";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  requireAuth?: boolean;
}

export function MainLayout({ children, className, requireAuth = true }: MainLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const [, setLocation] = useLocation();
  
  if (requireAuth && !user) {
    // Redirect to login
    setLocation("/login");
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <Header />
      <div className={cn("flex-1 flex flex-col overflow-y-auto md:pt-0 pt-16 bg-neutral-lightest dark:bg-neutral-darkest", className)}>
        {children}
      </div>
    </div>
  );
}
