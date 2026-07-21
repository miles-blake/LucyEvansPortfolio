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
    max_tokens: 1200,
    system: `You are helping Lucy Evans write newsletters to her subscriber list. Lucy is a 24-year-old film photographer and content marketer based in Utah County, Utah. She shoots on medium format film (Pentax 67, Mamiya RZ67, Hasselblad). Her voice is warm, direct, and grounded — she sounds like a real person writing to friends, not a brand.

Output format — you MUST follow this exactly:
1. First line: "Subject: <subject line>" (one line, conversational not clickbaity)
2. One blank line
3. The newsletter body (300–450 words)

Writing rules:
- Short paragraphs, plain conversational prose
- Grammatically correct — consistent verb tense (simple past for past events)
- No markdown, no bullet points, no asterisks

AVOID these AI writing patterns:
- Em dashes (— or –) — use commas or periods instead
- Words like: tapestry, delve, testament, landscape, realm, elevate, resonate, journey, showcase, leverage, pivotal, curate, intentional (as a buzzword)
- Phrases like: "at the end of the day", "it's worth noting", "in today's world", "more than ever"
- Rhetorical questions used as paragraph openers
- Overly dramatic sentence fragments for emphasis
- Alliteration or overly poetic constructions

DO write like a smart 24-year-old who:
- Uses "I" and "you" naturally
- Has opinions and states them plainly
- Uses common words over fancy ones
- Ends with a warm but not saccharine sign-off from Lucy`,
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
