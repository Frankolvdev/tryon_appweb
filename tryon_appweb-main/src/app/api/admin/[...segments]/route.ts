import { NextRequest, NextResponse } from "next/server";

import { forwardAdminRequest } from "@/lib/server/admin-route-proxy";

interface RouteContext {
  params: Promise<{
    segments: string[];
  }>;
}

async function createBackendPath(
  request: NextRequest,
  context: RouteContext,
): Promise<string> {
  const { segments } = await context.params;

  const encodedSegments = segments.map((segment) =>
    encodeURIComponent(segment),
  );

  const query = request.nextUrl.searchParams.toString();

  return `/api/v1/admin/${encodedSegments.join("/")}${
    query ? `?${query}` : ""
  }`;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return forwardAdminRequest({
    backendPath: await createBackendPath(request, context),
    method: "GET",
    request,
  });
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return forwardAdminRequest({
    backendPath: await createBackendPath(request, context),
    method: "POST",
    request,
  });
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return forwardAdminRequest({
    backendPath: await createBackendPath(request, context),
    method: "PUT",
    request,
  });
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return forwardAdminRequest({
    backendPath: await createBackendPath(request, context),
    method: "PATCH",
    request,
  });
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return forwardAdminRequest({
    backendPath: await createBackendPath(request, context),
    method: "DELETE",
    request,
  });
}