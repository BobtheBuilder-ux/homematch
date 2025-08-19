"use client";

import Loading from "@/components/Loading";
import Navbar from "@/components/Navbar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip auth checks for coming-soon pages
    if (pathname?.startsWith("/coming-soon")) {
      setIsLoading(false);
      return;
    }

    if (authUser && pathname) {
      const userRole = authUser.userRole?.toLowerCase();
      
      // Special handling for landlords - check onboarding status
      if (userRole === "landlord") {
        const isOnboardingComplete = authUser.userInfo?.isOnboardingComplete;
        
        // If landlord hasn't completed onboarding and is not already on onboarding page
        if (!isOnboardingComplete && !pathname.startsWith("/landlords/onboarding")) {
          router.push("/landlords/onboarding", { scroll: false });
          return;
        }
        
        // If landlord has completed onboarding and is on general pages, redirect to dashboard
        if (isOnboardingComplete && (pathname.startsWith("/search") || pathname === "/")) {
          router.push("/landlords/properties", { scroll: false });
          return;
        }
      }
      
      // Handle other roles
      if (
        (userRole === "admin" && pathname === "/") ||
        (userRole === "agent" && pathname === "/")
      ) {
        const redirectPath = ({
          admin: "/admin/analytics",
          agent: "/agent/leads"
        } as Record<string, string>)[userRole] || "/";
        
        router.push(redirectPath, { scroll: false });
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [authUser, router, pathname]);

  if (authLoading || isLoading) return <Loading />;

  return (
    <div className="h-full w-full">
      <Navbar />
      <main
        className={`h-full flex w-full flex-col`}
        style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
