import { jwt } from "hono/jwt";
import { createMiddleware } from "hono/factory";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const jwtMiddleware = jwt({ secret: JWT_SECRET, alg: "HS256" });

export const authMiddleware = createMiddleware(async (c, next) => {
  try {
    await jwtMiddleware(c, next);
  } catch (err) {
    const error = err as Error;
    if (error.name === "JwtTokenInvalid" || error.name === "JwtTokenExpired" || error.name === "JwtTokenMissing") {
      return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
    }
    console.error("Auth middleware error:", error);
    return c.json({ error: "Authentication failed", code: "AUTH_ERROR" }, 401);
  }
});

export { JWT_SECRET };
