"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasProfile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      // Not logged in
      if (!user && pathname !== "/login") {
        router.replace("/login");
      }
      
      // Ghost User: Logged in but has no profile (aborted signup)
      if (user && hasProfile === false && pathname !== "/login") {
        logout();
        router.replace("/login");
      }
    }
  }, [user, loading, hasProfile, router, pathname, mounted, logout]);

  // Handle flash of unauthenticated content
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
      </div>
    );
  }

  // If not authenticated and on a protected route, render nothing while redirecting
  if (!user && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
