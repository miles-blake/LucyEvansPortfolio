"use client";

import { useActionState } from "react";
import { updateWatermarkSettings } from "./actions";

type Settings = {
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: string;
  watermarkFontSize: number;
};

export function WatermarkForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(
    updateWatermarkSettings as (prev: unknown, fd: FormData) => Promise<{ error?: string; success?: boolean } | undefined>,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">Watermark text</label>
        <input
          name="watermarkText"
          defaultValue={settings.watermarkText}
          required
          className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="font-meta text-xs text-muted-foreground block mb-1">Opacity (0–100)</label>
          <input
            name="watermarkOpacity"
            type="number"
            min="0"
            max="100"
            defaultValue={settings.watermarkOpacity}
            className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
          />
        </div>
        <div>
          <label className="font-meta text-xs text-muted-foreground block mb-1">Font size (px)</label>
          <input
            name="watermarkFontSize"
            type="number"
            min="8"
            max="72"
            defaultValue={settings.watermarkFontSize}
            className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
          />
        </div>
        <div>
          <label className="font-meta text-xs text-muted-foreground block mb-1">Position</label>
          <select
            name="watermarkPosition"
            defaultValue={settings.watermarkPosition}
            className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
          >
            <option value="south_east">Bottom right</option>
            <option value="south_west">Bottom left</option>
            <option value="north_east">Top right</option>
            <option value="north_west">Top left</option>
            <option value="center">Center</option>
          </select>
        </div>
      </div>

      {state?.error && (
        <p className="font-meta text-sm text-rose-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="font-meta text-sm text-sage">Settings saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream font-meta text-xs px-5 py-2 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
