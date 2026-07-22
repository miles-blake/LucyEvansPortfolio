import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ predictions: [] });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ predictions: [] });

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({
      input: q,
      languageCode: "en",
      includedRegionCodes: ["us"],
    }),
  });

  const data = await res.json();
  const suggestions = data.suggestions ?? [];

  const predictions = suggestions
    .map((s: { placePrediction?: { placeId?: string; text?: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }) => s.placePrediction)
    .filter(Boolean)
    .map((p: { placeId?: string; text?: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } }) => ({
      place_id: p.placeId ?? "",
      description: p.text?.text ?? "",
      structured_formatting: {
        main_text: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
        secondary_text: p.structuredFormat?.secondaryText?.text ?? "",
      },
    }));

  return NextResponse.json({ predictions });
}
