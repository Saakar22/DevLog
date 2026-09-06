import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { subscribeToAuth, signInWithGoogle } from "./lib/firebase";
import { LandingView } from "./components/LandingView";
import { DashboardView } from "./components/DashboardView";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Authentication failed:", err);
      // Friendly message for popup cancellation or network error
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup was closed before completing.");
      } else if (err.code === "auth/popup-blocked") {
        setAuthError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setAuthError(err.message || "Failed to authenticate with Google.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Initial loading screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400">Verifying security context &amp; auth token...</p>
      </div>
    );
  }

  // Not signed in: Show Landing Page
  if (!currentUser) {
    return (
      <LandingView
        onSignIn={handleSignIn}
        isLoading={isSigningIn}
        authError={authError}
      />
    );
  }

  // Authenticated: Show DevLog Dashboard
  return <DashboardView user={currentUser} />;
}
