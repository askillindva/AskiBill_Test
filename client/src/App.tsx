import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Setup from "@/pages/setup";
import Auth from "@/pages/auth";
import type { UserProfile } from "@shared/schema";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Check if user has completed setup
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const isSetupComplete = profile?.isSetupComplete === "true";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={Auth} />
        </>
      ) : !isSetupComplete ? (
        <Route path="/" component={Setup} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/setup" component={Setup} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
