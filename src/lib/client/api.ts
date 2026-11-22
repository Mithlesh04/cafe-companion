"use client";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit & { staffPin?: string }): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init?.headers as Record<string, string>) };
  if (init?.staffPin) headers["x-staff-pin"] = init.staffPin;
  const res = await fetch(path, { ...init, headers });
  const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  return body;
}

export const post = <T,>(path: string, data: unknown, staffPin?: string) =>
  api<T>(path, { method: "POST", body: JSON.stringify(data), staffPin });
