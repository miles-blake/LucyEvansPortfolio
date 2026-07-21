"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.email("Please enter a valid email address."),
});
type FormValues = z.infer<typeof schema>;

export default function NewsletterForm({
  source = "footer",
  className,
}: {
  source?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, source }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setStatus("success");
      setMessage("You're on the list.");
      reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {status === "success" ? (
        <p className="font-meta text-ink">{message}</p>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="flex-1">
            <Input
              {...register("email")}
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              aria-label="Email address"
              aria-describedby={errors.email ? "newsletter-error" : undefined}
              disabled={status === "loading"}
              className="bg-cream border-border placeholder:text-muted-foreground"
            />
            {errors.email && (
              <p id="newsletter-error" className="font-meta text-destructive mt-1">
                {errors.email.message}
              </p>
            )}
            {status === "error" && (
              <p className="font-meta text-destructive mt-1">{message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={status === "loading"}
            className="whitespace-nowrap"
          >
            {status === "loading" ? "Subscribing…" : "Subscribe"}
          </Button>
        </form>
      )}
    </div>
  );
}
