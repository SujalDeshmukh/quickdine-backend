import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getBookingById,
} from "../controllers/bookingController";
import { protect } from "../middlewares/auth";

/**
 * Booking Routes — /api/bookings
 * -----------------------------------------------
 * ALL booking routes are PRIVATE — they require a valid JWT.
 * The 'protect' middleware is applied to each route individually,
 * making the security boundary explicit and easy to read.
 *
 * Route Map (all require Authorization: Bearer <token>):
 *   POST  /api/bookings          → Create a new reservation (with slot validation)
 *   GET   /api/bookings/my       → Get all bookings for the logged-in user
 *   GET   /api/bookings/:id      → Get a single booking by _id (ownership-checked)
 *   PATCH /api/bookings/:id/cancel → Cancel a confirmed booking (ownership-checked)
 *
 * ⚠️  IMPORTANT Route Ordering Note:
 *   '/my' must be declared BEFORE '/:id' — otherwise Express will
 *   treat "my" as a MongoDB ObjectId and the getMyBookings controller
 *   will never be reached (it will try to find a booking with _id = "my").
 */
const router = Router();

// POST /api/bookings — Create a reservation (includes capacity validation)
router.post("/", protect, createBooking);

// GET /api/bookings/my — "My Bookings" dashboard; must come before /:id
router.get("/my", protect, getMyBookings);

// GET /api/bookings/:id — Single booking detail view
router.get("/:id", protect, getBookingById);

// PATCH /api/bookings/:id/cancel — Cancel a reservation
router.patch("/:id/cancel", protect, cancelBooking);

export default router;
