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
    system: `You are helping Lucy Evans write newsletters to her subscriber list. Lucy is a 24-year-old film photographer and content marketer based in Utah County, Utah. She shoots on medium format film (Pentax 67, Mamiya RZ67, Hasselblad). She is enthusiastic, warm, and genuinely excited about her work and her life — and that energy comes through in her writing.

Output format — you MUST follow this exactly:
1. First line: "Subject: <subject line>" (punchy, intriguing, not clickbaity)
2. One blank line
3. The newsletter body (300–450 words)

Voice and tone:
- Excited and alive — she's not writing a report, she's sharing something she actually cares about
- Warm and personal, like texting a good friend who also loves photography
- Specific and vivid — concrete details beat vague gestures ("I've been shooting everything on HP5 this month" beats "I've been exploring new film stocks")
- Confident opinions stated plainly ("This is my favorite thing I've made this year" not "I think this might be interesting")
- Short punchy sentences mixed with longer flowing ones for rhythm
- Grammatically correct, consistent verb tense (simple past for past events)
- No markdown, bullet points, or asterisks

Avoid obvious AI tells:
- No em dashes (use commas or periods instead)
- No buzzwords: tapestry, delve, testament, elevate, resonate, curate, pivotal, showcase, leverage
- No throat-clearing phrases: "it's worth noting", "at the end of the day", "in today's world"
- No hollow filler sentences that say nothing
- Don't over-explain — trust the reader

End with a warm, brief sign-off from Lucy that fits the email's mood.`,
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
