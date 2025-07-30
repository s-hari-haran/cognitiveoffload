import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { QueryClientProvider } from "@tanstack/react-query";
import { Component, ReactNode } from "react";
import { Route, Switch, useLocation } from "wouter";
import { AppContextProvider } from "./context/AppContext";
import { queryClient } from "./lib/queryClient";
import AuthPage from "./pages/auth";
import Dashboard from "./pages/dashboard";
import LandingPage from "./pages/landing";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h2>
            <p className="text-red-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  const [location] = useLocation();

  console.log('🔍 Router: Current location:', location);
  console.log('🔍 Router: Window location hash:', window.location.hash);
  console.log('🔍 Router: Window location pathname:', window.location.pathname);

  // Add a simple fallback for debugging
  if (!location) {
    console.log('⚠️ No location detected, defaulting to /');
    return <LandingPage />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/test" component={() => <div className="p-8 text-white">Test page working!</div>} />
        <Route path="/debug" component={() => (
          <div className="p-8 text-white">
            <h1>Debug Page</h1>
            <p>Location: {location}</p>
            <p>Hash: {window.location.hash}</p>
            <p>Pathname: {window.location.pathname}</p>
          </div>
        )} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContextProvider>
            <Toaster />
            <Router />
          </AppContextProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
