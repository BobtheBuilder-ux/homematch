"use client";

import { useGetAuthUserQuery } from "@/state/api";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/Loading";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && authUser) {
      const userInfo = authUser.userInfo;
      
      // Check if agent profile is incomplete
      const isProfileIncomplete = 
        !userInfo.name || 
        !userInfo.phoneNumber || 
        !userInfo.address ||
        userInfo.name.trim() === '' ||
        userInfo.phoneNumber.trim() === '' ||
        (userInfo.address && userInfo.address.trim() === '');

      // If profile is incomplete and not already on onboarding page, redirect
      if (isProfileIncomplete && pathname !== '/agent/onboarding') {
        router.push('/agent/onboarding');
        return;
      }

      // If profile is complete and on onboarding page, redirect to leads
      if (!isProfileIncomplete && pathname === '/agent/onboarding') {
        router.push('/agent/leads');
        return;
      }
    }
  }, [authUser, isLoading, pathname, router]);

  if (isLoading) {
    return <Loading />;
  }

  return <>{children}</>;
}