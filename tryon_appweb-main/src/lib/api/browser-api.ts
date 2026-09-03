import { apiFetch } from "@/lib/api";

export interface BrowserApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
}

/**
 * Browser-side API helper kept for compatibility with incremental modules.
 * Authentication, backend URL resolution and error normalization are delegated
 * to the AppWeb's canonical apiFetch implementation.
 */
export async function browserApiRequest<T>(
  path: string,
  options: BrowserApiRequestOptions = {},
): Promise<T> {
  const { body, ...init } = options;
  const normalizedBody =
    body == null ||
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
      ? body ?? undefined
      : JSON.stringify(body);

  return apiFetch<T>(path, {
    ...init,
    body: normalizedBody,
  });
}
