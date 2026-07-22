"use client";

// Transparent overlay that prevents right-click and long-press saving of the image underneath.
export function ProtectedImageOverlay() {
  return (
    <div
      aria-hidden="true"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className="absolute inset-0 z-10 select-none"
      style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
    />
  );
}
