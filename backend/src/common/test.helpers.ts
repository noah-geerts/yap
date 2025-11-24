import { vi } from "vitest";
import { Request, Response } from "express";

// Helper function to get a valid JWT from auth0
export async function getValidJWT() {
  const response = await fetch(
    "https://dev-h60bzgedqbu866oj.us.auth0.com/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: "msaJIGv2TarVXWQ6XaxSTbqiyEzScJM0",
        client_secret:
          "Iy_nHDdoIYg0CcQndaDI_TRMP7YKoy14Bpy7g1LTqjcu-22EHhXBf00blYrdosQJ",
        audience: "http://localhost:3000",
        grant_type: "client_credentials",
      }),
    }
  );
  const data = await response.json();
  return data.access_token;
}

// Helper function to create mock request
export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as Request;
}

// Helper function to create mock response
export function createMockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return res;
}
