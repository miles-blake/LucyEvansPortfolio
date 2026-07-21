"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;          // photoId or bundleId
  type: "photo" | "bundle";
  title: string;
  price: number;       // cents
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add(item) {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) return state; // digital goods — only one per item
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },
      remove(id) {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },
      clear() {
        set({ items: [] });
      },
      total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
      count() {
        return get().items.length;
      },
    }),
    { name: "lucy-evans-cart" }
  )
);
