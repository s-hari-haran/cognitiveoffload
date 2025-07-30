import React from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

// Simple hash routing hook
const useHashLocation = () => {
  const [loc, setLoc] = React.useState(() => {
    const hash = window.location.hash.slice(1) || "/";
    console.log('🔍 useHashLocation: Initial hash:', window.location.hash, 'Location:', hash);
    return hash;
  });

  React.useEffect(() => {
    const handler = () => {
      const newHash = window.location.hash.slice(1) || "/";
      console.log('🔍 useHashLocation: Hash changed to:', window.location.hash, 'Location:', newHash);
      setLoc(newHash);
    };

    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = React.useCallback((to: string) => {
    console.log('🔍 useHashLocation: Navigating to:', to);
    window.location.hash = to;
  }, []);

  return [loc, navigate];
};

createRoot(document.getElementById("root")!).render(
  <Router hook={useHashLocation}>
    <App />
  </Router>
);
