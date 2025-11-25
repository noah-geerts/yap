import { beforeAll, describe, expect, it } from "vitest";
import {
  getValidJWT,
  createMockRequest,
  createMockDuplex,
  createMockWss,
} from "../../common/test.helpers.js";
import { createWsAuthMiddleware } from "./wsAuth.middleware.js";

describe("WebSocket Auth Middleware", () => {
  const invalidJwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";
  let validJwt: string;
  const host = "host";

  // Get a valid JWT from Auth0 Authentication Server to use in tests
  beforeAll(async () => {
    validJwt = await getValidJWT();
  });

  it("Should destroy socket when no auth query param provided", async () => {
    // Arrange
    const req = createMockRequest({ url: host, headers: { host: host } });
    const duplex = createMockDuplex();
    const head: NonSharedBuffer = {} as NonSharedBuffer;
    const wss = createMockWss();

    // Act
    await createWsAuthMiddleware(wss)(req, duplex, head);

    // Assert
    expect(duplex.destroy).toHaveBeenCalled();
    expect(duplex.write).toHaveBeenCalledWith(
      "HTTP/1.1 401 Unauthorized\r\n\r\n"
    );
    expect(wss.handleUpgrade).toHaveBeenCalledTimes(0);
    expect(wss.emit).toHaveBeenCalledTimes(0);
  });

  it("Should destroy socket when invalid jwt provided", async () => {
    // Arrange
    const req = createMockRequest({
      url: host + `?auth=${invalidJwt}`,
      headers: { host: host },
    });
    const duplex = createMockDuplex();
    const head: NonSharedBuffer = {} as NonSharedBuffer;
    const wss = createMockWss();

    // Act
    await createWsAuthMiddleware(wss)(req, duplex, head);

    // Assert
    expect(duplex.destroy).toHaveBeenCalled();
    expect(duplex.write).toHaveBeenCalledWith(
      "HTTP/1.1 401 Unauthorized\r\n\r\n"
    );
    expect(wss.handleUpgrade).toHaveBeenCalledTimes(0);
    expect(wss.emit).toHaveBeenCalledTimes(0);
  });

  it("Should not destroy socket when valid jwt provided", async () => {
    // Arrange
    const req = createMockRequest({
      url: host + `?auth=${validJwt}`,
      headers: { host: host },
    });
    const duplex = createMockDuplex();
    const head: NonSharedBuffer = {} as NonSharedBuffer;
    const wss = createMockWss();

    // Act
    await createWsAuthMiddleware(wss)(req, duplex, head);

    // Assert
    expect(duplex.destroy).toHaveBeenCalledTimes(0);
    expect(duplex.write).toHaveBeenCalledTimes(0);
    expect(wss.handleUpgrade).toHaveBeenCalled();
  });
});
