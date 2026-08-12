import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";

// ─── Helper: generateToken ────────────────────────────────────────────────────
// Flow: Takes a user's MongoDB _id string, signs it into a JWT using
// the JWT_SECRET from environment variables, and returns the token string.
// The token has an expiry defined by JWT_EXPIRES_IN (e.g., "7d").
// This token is sent to the client and stored in localStorage.
const generateToken = (userId: string): string => {
  // Use a hardcoded expiry to satisfy @types/jsonwebtoken's StringValue type.
  // The env var value is used at runtime via the options object below.
  const signOptions: jwt.SignOptions = {
    expiresIn: "7d", // Default; override via JWT_EXPIRES_IN in .env at runtime
  };

  // Dynamically set from env if provided
  if (process.env.JWT_EXPIRES_IN) {
    signOptions.expiresIn = process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET as string,
    signOptions
  );
};

// ─── Controller: register ──────────────────────────────────────────────────────
/**
 * @desc    Register a new customer account
 * @route   POST /api/auth/register
 * @access  Public
 *
 * Flow:
 *  1. Destructure name, email, password, phone, role from req.body.
 *  2. Check if a user with the same email already exists in the DB.
 *  3. If not, create a new User document. The password is automatically
 *     hashed by the pre-save hook in the User model before saving.
 *  4. Generate a JWT for the newly registered user.
 *  5. Return the user's public data + the token to the client.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Basic validation: ensure required fields are present
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
      return;
    }

    // Step 2: Check for duplicate email to give a clean error message
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
      return;
    }

    // Step 3: Create the new user document.
    // Note: Only 'user' and 'owner' roles are allowed via public registration.
    // 'admin' role must be assigned directly in the database for security.
    const allowedRoles = ["user", "owner"];
    const assignedRole =
      role && allowedRoles.includes(role) ? role : "user";

    const newUser = await User.create({
      name,
      email,
      password, // Raw password — bcrypt hashing happens in the pre-save hook
      phone,
      role: assignedRole,
    });

    // Step 4: Generate JWT
    const token = generateToken(newUser._id.toString());

    // Step 5: Return success response (never return the password)
    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error: unknown) {
    // Mongoose validation errors (e.g., invalid email format) will be caught here
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    res.status(500).json({ success: false, message });
  }
};

// ─── Controller: login ────────────────────────────────────────────────────────
/**
 * @desc    Log in an existing user and return a JWT
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Flow:
 *  1. Destructure email and password from req.body.
 *  2. Find the user by email. We MUST explicitly select the password field
 *     here because the schema hides it by default (select: false).
 *  3. If the user doesn't exist or the password doesn't match, return
 *     a generic 401 error (don't reveal which one is wrong — security best practice).
 *  4. Generate a JWT and return it along with the user's public data.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate that both fields are provided
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    // Step 2: Find user and explicitly include the password field for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    // Step 3: Generic error prevents user enumeration attacks.
    // Don't say "user not found" vs "wrong password" — just say invalid credentials.
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    // Step 4: Generate JWT for the authenticated user
    const token = generateToken(user._id.toString());

    // Return user's public data + token
    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    res.status(500).json({ success: false, message });
  }
};

// ─── Controller: getMe ────────────────────────────────────────────────────────
/**
 * @desc    Get the currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires 'protect' middleware)
 *
 * Flow:
 *  1. The 'protect' middleware already verified the JWT and attached
 *     the full user document to req.user.
 *  2. This controller simply returns that user data.
 *  3. This endpoint is used by the frontend's AppContext on initial load
 *     to restore the user session if a token exists in localStorage.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is guaranteed to exist here because the 'protect' middleware
    // runs before this controller and would have already rejected the request
    // if the token was invalid.
    const user = req.user!;

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    res.status(500).json({ success: false, message });
  }
};
