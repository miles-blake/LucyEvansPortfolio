import "server-only";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { anthropic } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { prompt } = await req.json();
  if (!prompt?.trim()) return new Response("Prompt required", { status: 400 });

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are helping Lucy Evans write newsletters to her subscriber list. Lucy is a film photographer and content marketer based in Utah County, Utah. She shoots on medium format film (Pentax 67, Mamiya RZ67, Hasselblad). Her voice is warm, personal, knowledgeable but never pretentious — she writes like she's talking to a friend who loves photography and creative work.

Write newsletter body copy only (no subject line). Use short paragraphs. Plain prose — no markdown headers, no bullet points, no asterisks. 300–450 words. End with a warm sign-off from Lucy.`,
    messages: [
      {
        role: "user",
        content: `Write a newsletter based on this idea: ${prompt}`,
      },
    ],
  });

  // Stream the text tokens back as plain text
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
