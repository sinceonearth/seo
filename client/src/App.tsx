import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Profile from "@/pages/Dashboard";
import Trips from "@/pages/Flights";
import AddFlight from "@/pages/AddFlight";
import FlightDetail from "@/pages/FlightDetail";
import Admin from "@/pages/Admin";
import PendingApproval from "@/pages/PendingApproval";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, user } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (isAuthenticated && (location === '/login' || location === '/register')) {
      navigate('/');
    }
  }, [isAuthenticated, location, navigate]);

  if (isAuthenticated && user && !user.isAdmin) {
    return (
      <Switch>
        <Route path="/" component={PendingApproval} />
        <Route component={PendingApproval} />
      </Switch>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/register" component={Register} />
          <Route path="/login" component={Login} />
        </>
      ) : (
        <>
          <Route path="/" component={Profile} />
          <Route path="/trips" component={Trips} />
          <Route path="/add-flight" component={AddFlight} />
          <Route path="/flight/:id" component={FlightDetail} />
          <Route path="/admin" component={Admin} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ToastProvider>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
            <AppContent />
            <ToastViewport />
          </ToastProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Check mobile status using matchMedia (works in Replit preview and actual devices)
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const shouldRedirectToLogin = !isLoading && !isAuthenticated && isMobile && location === '/';

  useEffect(() => {
    if (shouldRedirectToLogin) {
      navigate('/login');
    }
  }, [shouldRedirectToLogin, navigate]);

  if (isLoading || shouldRedirectToLogin) {
    return null;
  }

  if (!isAuthenticated) {
    return <Router />;
  }

  // For non-admin users, show only PendingApproval without navigation
  if (user && !user.isAdmin) {
    return <Router />;
  }

  // For admin users, show full navigation
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />
      <Router />
      <BottomNav />
    </div>
  );
}

export default App;
