import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/lib/auth";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import TrainingPrograms from "@/pages/training-programs";
import Schedules from "@/pages/schedules";
import Meetings from "@/pages/meetings";
import Certificates from "@/pages/certificates";
import ProgramDetails from "@/pages/program-details";
import CreateProgram from "@/pages/create-program";
import CreateMeeting from "@/pages/create-meeting";
import UserManagement from "@/pages/user-management";
import Analytics from "@/pages/analytics";
import Profile from "@/pages/profile";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/training-programs" component={TrainingPrograms} />
      <Route path="/schedules" component={Schedules} />
      <Route path="/meetings" component={Meetings} />
      <Route path="/certificates" component={Certificates} />
      <Route path="/program/:id" component={ProgramDetails} />
      <Route path="/create-program" component={CreateProgram} />
      <Route path="/create-meeting" component={CreateMeeting} />
      <Route path="/users" component={UserManagement} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/profile" component={Profile} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
