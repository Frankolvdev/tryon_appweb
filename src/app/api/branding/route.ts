import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/system/branding`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const payload = await response.json();
    return NextResponse.json(payload, {
      status: response.status,
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { has_logo: false, logo: {}, favicon: {}, version: 0 },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
