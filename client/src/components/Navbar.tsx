"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { Bell, MessageCircle, Plus, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();

  const isDashboardPage =
    pathname?.includes("/landlords") || pathname?.includes("/tenants") ||
    pathname?.includes("/admin") || pathname?.includes("/agent");

  type UserRole = "landlord" | "tenant" | "admin" | "agent";
  
  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const getActionPath = (role: string | undefined): string => {
    const paths: Record<UserRole, string> = {
      landlord: "/landlords/newproperty",
      tenant: "/search",
      admin: "/admin/users",
      agent: "/agent/leads"
    };
    return paths[role?.toLowerCase() as UserRole] || "/search";
  };

  const getDashboardPath = (role: string | undefined): string => {
    const paths: Record<UserRole, string> = {
      landlord: "/landlords/properties",
      tenant: "/tenants/favorites",
      admin: "/admin/analytics",
      agent: "/agent/leads"
    };
    return paths[role?.toLowerCase() as UserRole] || "/";
  };

  return (
    <div
      className="fixed top-0 left-0 w-full z-50 shadow-xl"
      style={{ height: `${NAVBAR_HEIGHT}px` }}
    >
      <div className="flex justify-between items-center w-full py-3 px-8 bg-primary-700 text-white">
        <div className="flex items-center gap-4 md:gap-6">
          {isDashboardPage && (
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
          )}
          <Link
            href="/"
            className="cursor-pointer hover:!text-primary-300"
            scroll={false}
          >
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="HomeMatch Logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="text-xl font-bold">
                Home
                <span className="text-secondary-500 font-light hover:!text-primary-300">
                  Match
                </span>
              </div>
            </div>
          </Link>
          {isDashboardPage && authUser && (
            <Button
              variant="secondary"
              className="md:ml-4 bg-primary-50 text-primary-700 hover:bg-secondary-500 hover:text-primary-50"
              onClick={() => router.push(getActionPath(authUser.userRole))}
            >
              {(() => {
                const userRole = authUser.userRole?.toLowerCase();
                switch (userRole) {
                  case "landlord":
                    return (
                      <>
                        <Plus className="h-4 w-4" />
                        <span className="hidden md:block ml-2">Add New Property</span>
                      </>
                    );
                  case "admin":
                    return (
                      <>
                        <Plus className="h-4 w-4" />
                        <span className="hidden md:block ml-2">Manage Users</span>
                      </>
                    );
                  case "agent":
                    return (
                      <>
                        <Plus className="h-4 w-4" />
                        <span className="hidden md:block ml-2">View Leads</span>
                      </>
                    );
                  default:
                    return (
                      <>
                        <Search className="h-4 w-4" />
                        <span className="hidden md:block ml-2">Search Properties</span>
                      </>
                    );
                }
              })()}
            </Button>
          )}
        </div>
        {!isDashboardPage && (
          <p className="text-primary-200 hidden md:block">
            Discover your perfect rental apartment with our advanced search
          </p>
        )}
        <div className="flex items-center gap-5">
          {authUser ? (
            <>
              <div className="relative hidden md:block">
                <MessageCircle className="w-6 h-6 cursor-pointer text-primary-200 hover:text-primary-400" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-secondary-700 rounded-full"></span>
              </div>
              <div className="relativemd:block">
                <NotificationBell />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                  <Avatar>
                    <AvatarImage src={authUser.userInfo?.image} />
                    <AvatarFallback className="bg-primary-600">
                      {authUser.userRole?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-primary-200 hidden md:block">
                    {authUser.userInfo?.name}
                  </p>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white text-primary-700">
                  <DropdownMenuItem
                    className="cursor-pointer hover:!bg-primary-700 hover:!text-primary-100 font-bold"
                    onClick={() => router.push(getDashboardPath(authUser.userRole), { scroll: false })}
                  >
                    Go to Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary-200" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:!bg-primary-700 hover:!text-primary-100"
                    onClick={() =>
                      {
                        const userRole = authUser.userRole?.toLowerCase();
                        const settingsPath = userRole === "admin" || userRole === "agent" 
                          ? `/${userRole}/settings`
                          : `/${userRole}s/settings`;
                        
                        router.push(settingsPath, { scroll: false });
                      }
                    }
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:!bg-primary-700 hover:!text-primary-100"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button
                  variant="outline"
                  className="text-white border-white bg-transparent hover:bg-white hover:text-primary-700 rounded-lg"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  variant="secondary"
                  className="text-white bg-secondary-600 hover:bg-white hover:text-primary-700 rounded-lg"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
