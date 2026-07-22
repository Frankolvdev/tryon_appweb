import { NextRequest, NextResponse } from "next/server";

import { proxyBackend } from "@/lib/server/backend-proxy";

interface ForwardAdminRequestOptions {
  backendPath: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  request?: NextRequest | Request;
}

function canHaveBody(method: ForwardAdminRequestOptions["method"]): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH";
}

export async function forwardAdminRequest({
  backendPath,
  method,
  request,
}: ForwardAdminRequestOptions): Promise<NextResponse> {
  const headers = new Headers();
  const authorization = request?.headers.get("authorization");
  const contentType = request?.headers.get("content-type");
  const cookie = request?.headers.get("cookie");

  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);
  if (cookie) headers.set("cookie", cookie);

  let body: string | undefined;
  if (request && canHaveBody(method)) {
    const rawBody = await request.text();
    body = rawBody.trim() ? rawBody : undefined;
  }

  return proxyBackend(backendPath, {
    method,
    headers,
    body,
  });
}
