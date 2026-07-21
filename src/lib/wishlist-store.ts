"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  id: string;
  slug: string;
  title: string;
  previewImageUrl: string;
  price: number; // cents
}

interface WishlistStore {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  has: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle(item) {
        set((state) => {
          const exists = state.items.find((i) => i.id === item.id);
          if (exists) return { items: state.items.filter((i) => i.id !== item.id) };
          return { items: [...state.items, item] };
        });
      },
      has(id) { return get().items.some((i) => i.id === id); },
      remove(id) { set((state) => ({ items: state.items.filter((i) => i.id !== id) })); },
      clear() { set({ items: [] }); },
    }),
    { name: "lucy-evans-wishlist" }
  )
);
