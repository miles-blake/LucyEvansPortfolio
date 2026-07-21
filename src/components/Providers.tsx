"use client";

import { SessionProvider } from "next-auth/react";
import { PreviewBanner } from "@/components/PreviewBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PreviewBanner />
      {children}
    </SessionProvider>
  );
}
