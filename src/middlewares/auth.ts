import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user";

// ─── Extend the Express Request Interface ────────────────────────────────────
// By default, Express's Request object does not have a 'user' property.
// We augment the global namespace so TypeScript knows that req.user exists
// after the protect middleware has verified and attached it.
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// ─── JwtPayload Interface ─────────────────────────────────────────────────────
// Describes the expected shape of the decoded JWT payload.
interface JwtPayload {
  id: string;
}

/**
 * protect — Authentication Middleware (Route Guard)
 * -----------------------------------------------
 * Flow:
 *  1. Reads the 'Authorization' header from the incoming HTTP request.
 *  2. Checks for a Bearer token (format: "Bearer <token>").
 *  3. Verifies the token signature using the JWT_SECRET from environment.
 *  4. Decodes the token payload to get the user's ID.
 *  5. Fetches the user from the database (to confirm they still exist).
 *  6. Attaches the user object to req.user so subsequent controllers
 *     can access the authenticated user without another DB query.
 *  7. If any step fails, it returns a 401 Unauthorized response.
 *
 * Usage: Add 'protect' as middleware on any route that requires login.
 *   Example: router.get('/bookings', protect, getMyBookings)
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Step 1 & 2: Extract Bearer token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token is found, reject the request immediately
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Not authorized. Please log in to continue.",
    });
    return;
  }

  try {
    // Step 3 & 4: Verify the token and decode the payload
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Step 5: Find the user in the database using the ID from the token payload.
    // We do NOT select the password field here for security.
    const user = await User.findById(decoded.id);

    if (!user) {
      // Token was valid but the user no longer exists in the database.
      res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
      return;
    }

    // Step 6: Attach the user to the request object for downstream controllers
    req.user = user;
    next(); // Hand control to the next middleware / controller

  } catch (error) {
    // Handles: TokenExpiredError, JsonWebTokenError, NotBeforeError
    res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};
