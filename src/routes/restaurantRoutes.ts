import { Router } from "express";
import {
  getRestaurants,
  getRestaurantBySlug,
  getSlotAvailability,
  getFeaturedRestaurants,
} from "../controllers/restaurantController";

/**
 * Restaurant Routes — /api/restaurants
 * -----------------------------------------------
 * All routes are PUBLIC — no authentication required for browsing.
 * Customers can discover and view restaurants without an account.
 *
 * Route Map:
 *   GET /api/restaurants             → Search/filter all approved restaurants
 *   GET /api/restaurants/featured    → Get featured restaurants (Home page)
 *   GET /api/restaurants/:slug       → Get single restaurant by URL slug
 *   GET /api/restaurants/:id/availability?date=YYYY-MM-DD
 *                                    → Get real-time slot availability for a date
 *
 * ⚠️  IMPORTANT Route Ordering Note:
 *   Express matches routes in the order they are declared.
 *   The '/featured' route MUST be declared BEFORE the '/:slug' route,
 *   otherwise Express will interpret "featured" as a slug value and
 *   the getFeaturedRestaurants controller will never be reached.
 */
const router = Router();

// --- Public Routes ---

// GET /api/restaurants — Supports query params: search, location, cuisine, priceRange, sort
router.get("/", getRestaurants);

// GET /api/restaurants/featured — Must come before /:slug to avoid route conflict
router.get("/featured", getFeaturedRestaurants);

// GET /api/restaurants/:id/availability?date=2026-08-15
// ':id' here is the MongoDB _id of the restaurant
router.get("/:id/availability", getSlotAvailability);

// GET /api/restaurants/:slug — Uses the URL-friendly slug for navigation
router.get("/:slug", getRestaurantBySlug);

export default router;
