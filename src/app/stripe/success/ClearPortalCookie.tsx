"use client";

import { useEffect } from "react";

export function ClearPortalCookie() {
  useEffect(() => {
    fetch("/api/stripe/clear-portal-cookie", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
