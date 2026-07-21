import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ predictions: [] });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ predictions: [] });

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", q);
  url.searchParams.set("key", key);
  url.searchParams.set("language", "en");
  // Bias toward US but don't restrict — venues may be destination weddings
  url.searchParams.set("components", "country:us");
  url.searchParams.set("types", "establishment");

  const res = await fetch(url.toString());
  const data = await res.json();

  return NextResponse.json({ predictions: data.predictions ?? [] });
}
