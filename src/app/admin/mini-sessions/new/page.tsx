import { createMiniSessionDay } from "../actions";
import { NewMiniSessionForm } from "./NewMiniSessionForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — New Mini Session Day" };

export default function NewMiniSessionPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ink mb-8">New mini session day</h1>
      <NewMiniSessionForm createAction={createMiniSessionDay} />
    </div>
  );
}
