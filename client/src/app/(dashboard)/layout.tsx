"use client";

import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "@/components/AppSidebar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import React, { useEffect, useState } from "react";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      const userRole = authUser.userRole?.toLowerCase();
      if (
        (userRole === "landlord" && (pathname.startsWith("/tenants") || pathname.startsWith("/admin") || pathname.startsWith("/agent"))) ||
        (userRole === "tenant" && (pathname.startsWith("/landlords") || pathname.startsWith("/admin") || pathname.startsWith("/agent"))) ||
        (userRole === "admin" && (pathname.startsWith("/landlords") || pathname.startsWith("/tenants") || pathname.startsWith("/agent"))) ||
        (userRole === "agent" && (pathname.startsWith("/landlords") || pathname.startsWith("/tenants") || pathname.startsWith("/admin")))
      ) {
        const redirectPath: { [key: string]: string } = {
          landlord: "/landlords/properties",
          tenant: "/tenants/favorites",
          admin: "/admin/analytics",
          agent: "/agent/leads"
        };
        
        router.push(redirectPath[userRole as keyof typeof redirectPath] || "/", { scroll: false });
      } else {
        setIsLoading(false);
      }
    }
  }, [authUser, router, pathname]);

  if (authLoading || isLoading) return <>Loading...</>;
  if (!authUser?.userRole) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-primary-100">
        <Navbar />
        <div style={{ marginTop: `${NAVBAR_HEIGHT}px` }}>
          <main className="flex">
            <Sidebar userType={authUser.userRole.toLowerCase()} />
            <div className="flex-grow transition-all duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
