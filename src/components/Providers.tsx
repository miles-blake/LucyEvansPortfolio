"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { PreviewBanner } from "@/components/PreviewBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PreviewBanner />
      {children}
      <Toaster position="bottom-right" richColors />
    </SessionProvider>
  );
}
