"use client";

import StoreProvider from "@/state/redux";
import BetterAuthProvider from "./(auth)/betterAuthProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <BetterAuthProvider>{children}</BetterAuthProvider>
    </StoreProvider>
  );
};

export default Providers;
