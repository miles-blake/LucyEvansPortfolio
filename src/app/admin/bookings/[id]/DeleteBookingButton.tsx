"use client";

import { deleteBooking } from "../actions";

export function DeleteBookingButton({ bookingId }: { bookingId: string }) {
  return (
    <form
      action={deleteBooking}
      onSubmit={(e) => {
        if (!confirm("Delete this booking permanently? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={bookingId} />
      <button
        type="submit"
        className="font-meta text-xs border border-rose-300 text-rose-600 px-4 py-2 rounded-sm hover:bg-rose-50 transition-colors"
      >
        Delete booking
      </button>
    </form>
  );
}
