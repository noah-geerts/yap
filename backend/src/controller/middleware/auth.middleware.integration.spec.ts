import { describe, it, vi, expect, beforeAll } from "vitest";
import {
  createMockRequest,
  createMockResponse,
  getValidJWT,
} from "../../common/test.helpers.js";
import { authMiddleware } from "./auth.middleware.js";

describe("Auth Middleware", () => {
  const invalidJwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";
  let validJwt: string;

  // Get a valid JWT from Auth0 Authentication Server to use in tests
  beforeAll(async () => {
    validJwt = await getValidJWT();
  });

  it("Should call res.status(401) when no auth header included", async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(0);
  });

  it("Should call res.status(401) when auth header incorrectly structured", async () => {
    const req = createMockRequest({
      headers: { authorization: "InvalidFormat" },
    });
    const res = createMockResponse();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(0);
  });

  it("Should call res.status(401) when jwt invalid", async () => {
    const req = createMockRequest({
      headers: { authorization: `Bearer ${invalidJwt}` },
    });
    const res = createMockResponse();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(0);
  });

  it("Should call next() when jwt valid", async () => {
    const req = createMockRequest({
      headers: { authorization: `Bearer ${validJwt}` },
    });
    const res = createMockResponse();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
