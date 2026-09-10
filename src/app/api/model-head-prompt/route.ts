import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_VERSION = "face-geometry-v3-distinct";

// Server-only catalog. This module is never imported by a Client Component, so
// the complete geometry library is not shipped in the browser JavaScript.
const CATALOG = {
  faceShape: [
    "slender elongated oval facial structure", "balanced oval facial structure", "short broad oval facial structure", "round facial structure", "heart-shaped facial structure", "diamond-shaped facial structure", "soft square facial structure", "angular square facial structure", "oblong facial structure", "rectangular facial structure", "inverted-triangle facial structure", "pear-shaped facial structure", "long narrow facial structure", "tapered oval facial structure", "broad oval facial structure", "short round facial structure", "long heart-shaped facial structure", "broad diamond-shaped facial structure", "narrow triangular facial structure", "soft trapezoid facial structure"
  ],
  facialWidth: [
    "very narrow facial width", "narrow facial width", "moderately narrow facial width", "balanced facial width", "moderately broad facial width", "broad facial width", "very broad facial width", "narrow upper-face width", "broad upper-face width", "narrow central facial width", "broad central facial width", "compact facial width"
  ],
  facialLength: [
    "very short vertical facial proportions", "short vertical facial proportions", "moderately short vertical facial proportions", "balanced vertical facial proportions", "moderately elongated facial proportions", "elongated vertical facial proportions", "very elongated facial proportions", "compact facial proportions", "long upper facial proportions", "long lower facial proportions"
  ],
  midface: [
    "very short compact midface", "short compact midface", "moderately short midface", "balanced midface", "moderately long midface", "long midface", "very long midface", "narrow midface", "broad midface", "compact broad midface", "long narrow midface", "long broad midface", "short narrow midface", "short broad midface"
  ],
  cheekbones: [
    "low subtle cheekbones", "low broad cheekbones", "soft rounded cheekbones", "moderately defined cheekbones", "moderately high cheekbones", "high defined cheekbones", "high prominent cheekbones", "very high prominent cheekbones", "broad cheekbones", "narrow cheekbone structure", "laterally projected cheekbones", "high laterally projected cheekbones", "forward projected cheekbones", "flat subtle cheekbones", "angular defined cheekbones", "full rounded cheekbones"
  ],
  lowerFace: [
    "very tapered lower face", "narrow tapered lower face", "tapered lower face", "balanced lower-face width", "rounded lower face", "moderately broad lower face", "broad lower face", "very broad lower face", "angular lower face", "short compact lower face", "long narrow lower face", "long broad lower face"
  ],
  jawline: [
    "very delicate narrow jawline", "delicate narrow jawline", "narrow tapered jawline", "softly tapered jawline", "soft rounded jawline", "balanced softly defined jawline", "clean defined jawline", "angular defined jawline", "sharp angular jawline", "broad softly defined jawline", "broad angular jawline", "broad square jawline", "strong square jawline", "short compact jawline", "long narrow jawline", "wide rounded jawline"
  ],
  chin: [
    "very small rounded chin", "small softly rounded chin", "short rounded chin", "medium rounded chin", "broad rounded chin", "small pointed chin", "delicate pointed chin", "moderately pointed chin", "long pointed chin", "square chin", "broad square chin", "short flat chin", "long defined chin", "recessed delicate chin", "forward defined chin", "balanced chin"
  ],
  forehead: [
    "very short forehead", "short forehead", "medium-height forehead", "moderately tall forehead", "tall forehead", "very tall forehead", "narrow forehead", "broad forehead", "very broad forehead", "rounded forehead", "flat forehead", "slightly sloped forehead", "high rounded forehead", "short broad forehead"
  ],
  noseProfile: [
    "perfectly straight nose profile", "slightly concave nose profile", "pronounced concave nose profile", "softly convex nose profile", "pronounced convex nose profile", "gently arched nose profile", "aquiline nose profile", "Roman nose profile", "button nose profile", "celestial nose profile", "short straight nose profile", "long straight nose profile"
  ],
  noseWidth: [
    "very narrow nose", "narrow nose", "moderately narrow nose", "medium-width nose", "moderately broad nose", "broad nose", "very broad nose", "narrow upper nose with broader nostrils", "broad upper nose with narrow nostrils", "compact narrow nose", "compact broad nose", "long narrow nose"
  ],
  noseBridge: [
    "very low nasal bridge", "low nasal bridge", "moderately low nasal bridge", "medium-height nasal bridge", "moderately high nasal bridge", "high nasal bridge", "very high nasal bridge", "narrow defined nasal bridge", "broad softly defined nasal bridge", "broad strong nasal bridge", "short nasal bridge", "long nasal bridge"
  ],
  noseTip: [
    "very small defined nasal tip", "small rounded nasal tip", "soft rounded nasal tip", "narrow pointed nasal tip", "broad rounded nasal tip", "bulbous nasal tip", "slightly upturned nasal tip", "strongly upturned nasal tip", "neutral nasal tip", "slightly downturned nasal tip", "strongly downturned nasal tip", "projected nasal tip", "short compact nasal tip", "wide soft nasal tip"
  ],
  noseLength: [
    "very short nose length", "short nose length", "moderately short nose length", "balanced nose length", "moderately long nose length", "long nose length", "very long nose length", "compact nose length", "elongated nose length", "short projected nose"
  ],
  eyeShape: [
    "fox eyes", "cat eyes", "doe eyes", "almond eyes", "narrow almond eyes", "wide almond eyes", "round eyes", "upturned eyes", "downturned eyes", "hooded eyes", "deep-set eyes", "elongated eyes", "monolid eyes", "prominent round eyes", "heavy-lidded eyes", "soft triangular eyes"
  ],
  eyeSize: [
    "very small eyes", "small eyes", "moderately small eyes", "medium-sized eyes", "moderately large eyes", "large eyes", "very large eyes", "narrow small eyes", "wide large eyes", "prominent medium-sized eyes"
  ],
  eyeSpacing: [
    "very close-set eyes", "close-set eyes", "moderately close-set eyes", "balanced eye spacing", "moderately wide-set eyes", "wide-set eyes", "very wide-set eyes", "compact eye spacing", "broad eye spacing", "slightly asymmetric natural eye spacing"
  ],
  templeWidth: [
    "very narrow temple width", "narrow temple width", "moderately narrow temples", "balanced temple width", "moderately broad temples", "broad temple width", "very broad temple width", "tapered temples", "straight temple width", "rounded broad temples"
  ],
} as const;

type CatalogKey = keyof typeof CATALOG;
const ORDER: CatalogKey[] = ["faceShape","facialWidth","facialLength","midface","cheekbones","lowerFace","jawline","chin","forehead","noseProfile","noseWidth","noseBridge","noseTip","noseLength","eyeShape","eyeSize","eyeSpacing","templeWidth"];

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
