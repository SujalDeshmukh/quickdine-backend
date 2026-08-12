import { Request, Response } from "express";
import Restaurant from "../models/restaurant";

// ─── Controller: getRestaurants ───────────────────────────────────────────────
/**
 * @desc    Get all approved restaurants with optional search and filter
 * @route   GET /api/restaurants
 * @access  Public
 *
 * Flow:
 *  1. Parse query parameters from the URL:
 *       - search: keyword to match against name, cuisine, tags (MongoDB text search)
 *       - location: filter by city/area (case-insensitive partial match)
 *       - cuisine: one or more cuisine types (e.g., "Italian", "Japanese")
 *       - priceRange: one or more price tiers ("$", "$$", "$$$", "$$$$")
 *       - sort: sorting preference ("price_low" | "price_high" | default = newest)
 *  2. Build a Mongoose query object dynamically based on provided filters.
 *  3. Only return restaurants with status: 'approved' (customer-facing rule).
 *  4. Execute the query and return the matching restaurants array.
 *
 * This controller powers the frontend Search page (/search).
 */
export const getRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Destructure and parse query params
    const { search, location, cuisine, priceRange, sort } = req.query;

    // Step 2: Build the query filter object dynamically
    // Start with a base filter: only show customer-approved restaurants
    const filter: Record<string, unknown> = { status: "approved" };

    // Full-text search across name, cuisine, tags, description
    // Requires the text index on the Restaurant model.
    if (search && typeof search === "string") {
      filter.$text = { $search: search };
    }

    // Case-insensitive partial match on the location field
    if (location && typeof location === "string") {
      filter.location = { $regex: location, $options: "i" };
    }

    // Cuisine filter: can be a single string or an array of strings
    // e.g., ?cuisine=Italian&cuisine=Japanese
    if (cuisine) {
      const cuisineArray = Array.isArray(cuisine) ? cuisine : [cuisine];
      filter.cuisine = { $in: cuisineArray };
    }

    // Price range filter: can be multiple values
    // e.g., ?priceRange=$$$&priceRange=$$$$
    if (priceRange) {
      const priceArray = Array.isArray(priceRange) ? priceRange : [priceRange];
      filter.priceRange = { $in: priceArray };
    }

    // Step 3 & 4: Build and execute the query with sorting
    let query = Restaurant.find(filter);

    // Apply sorting based on the 'sort' query param
    if (sort === "price_low") {
      // Sort ascending by priceRange string length ($ < $$ < $$$ < $$$$)
      query = query.sort({ priceRange: 1 });
    } else if (sort === "price_high") {
      query = query.sort({ priceRange: -1 });
    } else {
      // Default: newest restaurants first
      query = query.sort({ createdAt: -1 });
    }

    const restaurants = await query;

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch restaurants.";
    res.status(500).json({ success: false, message });
  }
};

// ─── Controller: getRestaurantBySlug ──────────────────────────────────────────
/**
 * @desc    Get a single restaurant's full details by its URL slug
 * @route   GET /api/restaurants/:slug
 * @access  Public
 *
 * Flow:
 *  1. Extract the 'slug' from the URL params (e.g., /api/restaurants/kuro-omakase).
 *  2. Query the database for a restaurant matching that slug AND with
 *     status: 'approved' (customers cannot view pending/rejected restaurants).
 *  3. If found, return the full restaurant document.
 *  4. If not found, return a 404 error.
 *
 * The frontend uses the slug (not the _id) for navigation because slugs
 * are human-readable and SEO-friendly.
 */
export const getRestaurantBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    // Step 2: Find approved restaurant by slug
    const restaurant = await Restaurant.findOne({ slug, status: "approved" });

    // Step 4: Return 404 if restaurant doesn't exist or isn't approved
    if (!restaurant) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch restaurant.";
    res.status(500).json({ success: false, message });
  }
};

// ─── Controller: getSlotAvailability ──────────────────────────────────────────
/**
 * @desc    Get real-time seat availability for each time slot on a given date
 * @route   GET /api/restaurants/:id/availability?date=YYYY-MM-DD
 * @access  Public
 *
 * Flow:
 *  1. Extract the restaurant's MongoDB _id from URL params and the 'date'
 *     from the query string.
 *  2. Fetch the restaurant to get: totalSeats and availableSlots.
 *  3. Query the Bookings collection for all CONFIRMED bookings for
 *     this restaurant on the given date.
 *  4. For EACH time slot, use .reduce() to calculate how many seats are
 *     already taken (sum of guests across all bookings for that slot/date).
 *  5. Return an array of slot objects, each with:
 *       - time: The slot time string
 *       - availableSeats: totalSeats - bookedSeats
 *       - isAvailable: boolean (availableSeats > 0)
 *
 * This is the core real-time availability calculation the frontend displays
 * in the BookingWidget on the RestaurantDetail page.
 */
export const getSlotAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Validate required inputs
    if (!date || typeof date !== "string") {
      res.status(400).json({
        success: false,
        message: "A 'date' query parameter is required (format: YYYY-MM-DD).",
      });
      return;
    }

    // Step 2: Get the restaurant's capacity and available time slots
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      res.status(404).json({ success: false, message: "Restaurant not found." });
      return;
    }

    // Step 3: Build date range to cover the entire requested day (midnight to midnight).
    // This ensures we count all bookings for that calendar day regardless of timezone.
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Lazy import to avoid circular dependency issues at the top level
    const Booking = (await import("../models/booking")).default;

    // Fetch all CONFIRMED bookings for this restaurant on this date.
    // We only care about 'confirmed' ones; cancelled bookings free up their seats.
    const bookingsOnDate = await Booking.find({
      restaurant: id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "confirmed",
    });

    // Step 4 & 5: Calculate availability for each slot using .reduce()
    const slotsAvailability = restaurant.availableSlots.map((slotTime) => {
      // Use .reduce() to SUM all guests booked for this specific slot on this date.
      // .reduce() starts with accumulator = 0, and for each booking that matches
      // the current slotTime, it adds the number of guests to the accumulator.
      const bookedSeatsForSlot = bookingsOnDate.reduce(
        (totalBooked, booking) => {
          if (booking.time === slotTime) {
            // This booking is for this slot — add its guest count
            return totalBooked + booking.guests;
          }
          // This booking is for a different slot — don't count it
          return totalBooked;
        },
        0 // Initial accumulator value (no seats booked yet)
      );

      const availableSeats = restaurant.totalSeats - bookedSeatsForSlot;

      return {
        time: slotTime,
        availableSeats: Math.max(0, availableSeats), // Never show negative seats
        isAvailable: availableSeats > 0,
      };
    });

    res.status(200).json({
      success: true,
      data: slotsAvailability,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch availability.";
    res.status(500).json({ success: false, message });
  }
};

// ─── Controller: getFeaturedRestaurants ──────────────────────────────────────
/**
 * @desc    Get featured restaurants for the Home page hero section
 * @route   GET /api/restaurants/featured
 * @access  Public
 *
 * Flow:
 *  1. Query restaurants where 'featured' is true AND status is 'approved'.
 *  2. Limit the result to 6 (enough for a featured grid/carousel).
 *  3. Return them sorted by rating (highest first).
 *
 * This controller powers the "Featured" and "Recommended" sections
 * on the Home and Dashboard pages.
 */
export const getFeaturedRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const featured = await Restaurant.find({ featured: true, status: "approved" })
      .sort({ rating: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      count: featured.length,
      data: featured,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch featured restaurants.";
    res.status(500).json({ success: false, message });
  }
};
