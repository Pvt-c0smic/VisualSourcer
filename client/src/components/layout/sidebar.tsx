import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import {
  BookOpen,
  IdCard,
  ChevronRight,
  Calendar,
  Handshake,
  LayoutDashboard,
  Users,
  BarChart3,
  GraduationCap,
  List,
  Award,
  LogOut,
  User,
} from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { UserAvatar } from "./user-avatar";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const renderLinks = () => {
    if (!user) return null;

    return (
      <>
        {/* Admin Navigation */}
        {user.role === "admin" && (
          <div className="space-y-1 pt-6">
            <h3 className="px-3 text-xs font-semibold text-white uppercase tracking-wider">
              Administration
            </h3>
            <NavLink
              href="/dashboard"
              icon={<LayoutDashboard className="w-6 h-6" />}
              label="Dashboard"
              active={isActive("/dashboard")}
            />
            <NavLink
              href="/users"
              icon={<Users className="w-6 h-6" />}
              label="User Management"
              active={isActive("/users")}
            />
            <NavLink
              href="/analytics"
              icon={<BarChart3 className="w-6 h-6" />}
              label="Analytics"
              active={isActive("/analytics")}
            />
          </div>
        )}

        {/* Trainer Navigation */}
        {(user.role === "admin" || user.role === "trainer") && (
          <div className="space-y-1 pt-6">
            <h3 className="px-3 text-xs font-semibold text-white uppercase tracking-wider">
              Training Management
            </h3>
            <NavLink
              href="/training-programs"
              icon={<BookOpen className="w-6 h-6" />}
              label="Training Programs"
              active={isActive("/training-programs")}
            />
            <NavLink
              href="/schedules"
              icon={<Calendar className="w-6 h-6" />}
              label="Schedules"
              active={isActive("/schedules")}
            />
            <NavLink
              href="/meetings"
              icon={<Handshake className="w-6 h-6" />}
              label="Meetings"
              active={isActive("/meetings")}
            />
            <NavLink
              href="/certificates"
              icon={<IdCard className="w-6 h-6" />}
              label="Certificates"
              active={isActive("/certificates")}
            />
          </div>
        )}

        {/* Trainee Navigation */}
        {(user.role === "admin" || user.role === "trainee") && (
          <div className="space-y-1 pt-6">
            <h3 className="px-3 text-xs font-semibold text-white uppercase tracking-wider">
              Learning
            </h3>
            <NavLink
              href="/my-courses"
              icon={<GraduationCap className="w-6 h-6" />}
              label="My Courses"
              active={isActive("/my-courses")}
            />
            <NavLink
              href="/available-training"
              icon={<List className="w-6 h-6" />}
              label="Available Training"
              active={isActive("/available-training")}
            />
            <NavLink
              href="/my-certificates"
              icon={<Award className="w-6 h-6" />}
              label="My Certificates"
              active={isActive("/my-certificates")}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className={cn("hidden md:flex md:flex-col w-64 bg-primary dark:bg-neutral-darkest border-r border-neutral-light dark:border-neutral-dark", className)}>
      <div className="flex items-center h-16 px-4 border-b border-primary-light dark:border-neutral-dark">
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 rounded text-white">
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="ml-2 font-semibold text-white text-lg">TrainNET</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-white hover:text-neutral-light"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 py-4 space-y-1">{renderLinks()}</nav>
      </div>

      {user && (
        <div className="flex-shrink-0 p-4 border-t border-primary-light dark:border-neutral-dark">
          <div className="flex items-center mb-2">
            <UserAvatar user={user} className="h-10 w-10" />
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-neutral-light capitalize">{user.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-white hover:text-neutral-light"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <Link href="/profile">
            <a className="flex items-center justify-center w-full py-1.5 mt-1 text-sm text-white bg-primary-light dark:bg-sidebar-accent rounded-md hover:bg-primary-dark dark:hover:bg-sidebar-primary transition-colors">
              <User className="w-4 h-4 mr-2" />
              My Profile
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "group flex items-center px-3 py-2 text-sm font-medium rounded-md text-white",
          active ? "bg-primary-dark dark:bg-sidebar-primary" : "hover:bg-primary-light dark:hover:bg-sidebar-accent"
        )}
      >
        <span className="w-6 text-center">{icon}</span>
        <span className="ml-3">{label}</span>
        {active && <ChevronRight className="w-4 h-4 ml-auto" />}
      </a>
    </Link>
  );
}
