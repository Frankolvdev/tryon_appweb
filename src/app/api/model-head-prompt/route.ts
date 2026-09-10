import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_VERSION = "face-geometry-v2";

// Server-only catalog. This module is never imported by a Client Component, so
// the complete geometry library is not shipped in the browser JavaScript.
const CATALOG = {
  faceShape: [
    "slender elongated oval facial structure","delicate elongated oval facial structure","narrow oval facial structure","balanced oval facial structure","soft oval facial structure","short broad oval facial structure","long narrow facial structure","oblong facial structure","soft round facial structure","round facial structure","heart-shaped facial structure","soft heart-shaped facial structure","diamond-shaped facial structure","soft diamond-shaped facial structure","soft square facial structure","angular square facial structure","rectangular facial structure","inverted-triangle facial structure","pear-shaped facial structure","tapered oval facial structure"
  ],
  facialWidth: [
    "very narrow facial width","delicate narrow facial width","narrow facial width","moderately narrow facial width","slightly narrow facial width","balanced facial width","medium facial width","slightly broad facial width","moderately broad facial width","broad facial width","softly broad facial width","wide facial width"
  ],
  facialLength: [
    "short vertical facial proportions","moderately short vertical facial proportions","slightly short vertical facial proportions","compact vertical facial proportions","balanced vertical facial proportions","slightly elongated facial proportions","moderately elongated facial proportions","elongated vertical facial proportions","long vertical facial proportions","very elongated facial proportions"
  ],
  midface: [
    "very short compact midface","short compact midface","moderately short midface","slightly short midface","balanced midface","narrow balanced midface","moderately narrow midface","narrow midface","slightly long midface","moderately long midface","long midface","broad midface","moderately broad midface","compact broad midface"
  ],
  cheekbones: [
    "low subtle cheekbones","soft subtle cheekbones","softly defined cheekbones","moderately defined cheekbones","moderately high cheekbones","moderately high defined cheekbones","high softly prominent cheekbones","high defined cheekbones","high prominent cheekbones","very high prominent cheekbones","broad cheekbones","narrow cheekbone structure","laterally projected cheekbones","high laterally projected cheekbones","soft rounded cheekbones","angular defined cheekbones"
  ],
  lowerFace: [
    "very tapered lower face","narrow tapered lower face","tapered lower face","delicate narrow lower face","narrow lower face","slightly tapered lower face","balanced lower-face width","softly rounded lower face","moderately broad lower face","broad lower face","wide lower face","angular lower face"
  ],
  jawline: [
    "very delicate narrow jawline","delicate narrow jawline","slim softly defined jawline","narrow tapered jawline","softly tapered jawline","gently tapered jawline","soft rounded jawline","balanced softly defined jawline","moderately defined jawline","clean defined jawline","angular defined jawline","soft angular jawline","broad softly defined jawline","broad angular jawline","broad square jawline","strong square jawline"
  ],
  chin: [
    "very small softly rounded chin","small softly rounded chin","small rounded chin","delicate rounded chin","short rounded chin","medium rounded chin","softly defined chin","small pointed chin","delicate pointed chin","moderately pointed chin","defined pointed chin","broad rounded chin","broad defined chin","longer defined chin","short delicate chin","balanced chin"
  ],
  forehead: [
    "short forehead","moderately short forehead","slightly short forehead","medium-height forehead","balanced forehead","moderately tall forehead","tall forehead","high forehead","narrow forehead","moderately narrow forehead","moderately broad forehead","broad forehead","softly broad forehead","rounded forehead"
  ],
  noseProfile: [
    "straight nose profile","short straight nose profile","long straight nose profile","slightly concave nose profile","soft concave nose profile","softly convex nose profile","gently convex nose profile","gently arched nose profile","subtly arched nose profile","aquiline nose profile","delicate straight nose profile","soft straight nose profile"
  ],
  noseWidth: [
    "very narrow nose","delicate narrow nose","narrow nose","moderately narrow nose","slightly narrow nose","medium-width nose","balanced nose width","slightly broad nose","moderately broad nose","broad nose","softly broad nose","wide nose"
  ],
  noseBridge: [
    "low nasal bridge","moderately low nasal bridge","soft low nasal bridge","medium-height nasal bridge","balanced nasal bridge","moderately high nasal bridge","high nasal bridge","very high nasal bridge","narrow defined nasal bridge","delicate narrow nasal bridge","broad softly defined nasal bridge","broad defined nasal bridge"
  ],
  noseTip: [
    "very small defined nasal tip","small defined nasal tip","small softly rounded nasal tip","soft rounded nasal tip","narrow nasal tip","delicate narrow nasal tip","broad rounded nasal tip","soft broad nasal tip","slightly upturned nasal tip","small slightly upturned nasal tip","neutral nasal tip","slightly downturned nasal tip","defined nasal tip","rounded defined nasal tip"
  ],
  eyeShape: [
    "fox eyes","cat eyes","doe eyes","almond eyes","narrow almond eyes","wide almond eyes","round eyes","soft round eyes","upturned eyes","slightly upturned eyes","downturned eyes","slightly downturned eyes","hooded eyes","deep-set eyes","elongated eyes","soft elongated eyes"
  ],
} as const;

type CatalogKey = keyof typeof CATALOG;
const ORDER: CatalogKey[] = ["faceShape","facialWidth","facialLength","midface","cheekbones","lowerFace","jawline","chin","forehead","noseProfile","noseWidth","noseBridge","noseTip","eyeShape"];

function pick(seed: string, key: CatalogKey) {
  const digest = createHash("sha256").update(`${PROFILE_VERSION}:${seed}:${key}`).digest();
  const value = digest.readUInt32BE(0);
  const values = CATALOG[key];
  return values[value % values.length];
}

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
    const geometry = ORDER.map((key) => pick(seed, key));
    const pieces = [
      `random beautiful attractive ${age}-year-old woman of ${ancestry} ancestry`,
      ...geometry,
      iris,
      skin,
      hairColor,
      hairStyle ? `${hairStyle} hair style` : "",
      eyebrow ? `${eyebrow} eyebrow shape` : "",
      lips ? `${lips} lip shape` : "",
      "exceptionally beautiful face",
      "harmonious facial proportions",
      "aesthetically balanced facial features",
      "refined feminine features",
      "naturally attractive facial harmony",
      "naturally beautiful feminine appearance",
      "fresh healthy appearance",
      "clear healthy skin",
      "subtle natural makeup",
      "flattering natural appearance",
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
    return NextResponse.json({ prompt: pieces.join(", "), profile_version: PROFILE_VERSION }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ detail: "Could not build head prompt." }, { status: 400 });
  }
}
