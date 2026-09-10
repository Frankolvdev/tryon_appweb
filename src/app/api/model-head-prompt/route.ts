import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_VERSION = "node-traits-realism-v1";

function clean(value: unknown, max = 120) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const seed = clean(body.seed, 32);
    const numericSeed = Number(seed);
    if (!/^\d{15}$/.test(seed) || !Number.isSafeInteger(numericSeed)) {
      return NextResponse.json({ detail: "Invalid Seed Head." }, { status: 400 });
    }
    const age = Math.max(18, Math.min(60, Math.round(Number(body.age) || 25)));
    const ancestry = clean(body.ancestry, 80) || "unspecified";
    const iris = clean(body.iris);
    const skin = clean(body.skin);
    const hairColor = clean(body.hairColor);
    const hairStyle = clean(body.hairStyle);
    const eyebrow = clean(body.eyebrow);
    const lips = clean(body.lips);
    const pieces = [
      `random beautiful attractive ${age}-year-old woman of ${ancestry} ancestry`,
      iris,
      skin,
      hairColor,
      hairStyle ? `${hairStyle} hair style` : "",
      eyebrow ? `${eyebrow} eyebrow shape` : "",
      lips ? `${lips} lip shape` : "",
      "fresh healthy appearance",
      "clear healthy skin",
      "subtle natural makeup",
      "realistic skin texture",
      "visible fine pores",
      "realistic hair strands",
      "fitted black top",
      "frontal upper-chest photo",
      "looking directly at camera",
      "casual smartphone photo",
      "natural indoor lighting",
      "soft flattering everyday lighting",
      "slight smartphone camera noise",
      "realistic smartphone image quality",
      "plain white wall background",
    ].filter(Boolean);
    return NextResponse.json(
      { prompt: pieces.join(", "), profile_version: PROFILE_VERSION },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ detail: "Could not build head prompt." }, { status: 400 });
  }
}
