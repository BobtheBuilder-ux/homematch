"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Loading from "@/components/Loading";

interface BetterAuthProviderProps {
  children: React.ReactNode;
}

const BetterAuthProvider: React.FC<BetterAuthProviderProps> = ({ children }) => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname?.match(/^\/(signin|signup)$/);
  const isDashboardPage =
    pathname?.startsWith("/landlord") || 
    pathname?.startsWith("/tenants") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/admin");

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (session && isAuthPage) {
      router.push("/");
    }
  }, [session, isAuthPage, router]);

  // Redirect unauthenticated users away from dashboard pages
  useEffect(() => {
    if (!isPending && !session && isDashboardPage) {
      router.push("/signin");
    }
  }, [session, isDashboardPage, router, isPending]);

  // Show loading while checking authentication status
  if (isPending) {
    return <Loading />;
  }

  // Allow access to public pages without authentication
  if (!isAuthPage && !isDashboardPage) {
    return <>{children}</>;
  }

  // For auth pages, show them if user is not authenticated
  if (isAuthPage && !session) {
    return <>{children}</>;
  }

  // For dashboard pages, show them if user is authenticated
  if (isDashboardPage && session) {
    return <>{children}</>;
  }

  // Default fallback
  return <>{children}</>;
};

export default BetterAuthProvider;