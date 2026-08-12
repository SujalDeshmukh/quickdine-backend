import { Router } from "express";
import { register, login, getMe } from "../controllers/authController";
import { protect } from "../middlewares/auth";

/**
 * Auth Routes — /api/auth
 * -----------------------------------------------
 * Maps HTTP methods and URL paths to controller functions.
 *
 * Public routes (no token needed):
 *   POST /api/auth/register  → Create a new customer account
 *   POST /api/auth/login     → Log in and receive a JWT
 *
 * Private routes (JWT required):
 *   GET  /api/auth/me        → Get the currently logged-in user's profile
 *                              Used by the frontend's AppContext to restore
 *                              session on page reload.
 */
const router = Router();

// --- Public Routes ---
router.post("/register", register);
router.post("/login", login);

// --- Private Routes (protected by JWT middleware) ---
// 'protect' runs first: it verifies the token and attaches req.user.
// 'getMe' then runs and simply returns req.user.
router.get("/me", protect, getMe);

export default router;
