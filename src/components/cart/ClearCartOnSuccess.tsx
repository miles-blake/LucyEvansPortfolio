"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

// Clears the client-side cart once the server confirms the order is paid
export default function ClearCartOnSuccess() {
  const clear = useCart((s) => s.clear);
  useEffect(() => { clear(); }, [clear]);
  return null;
}
