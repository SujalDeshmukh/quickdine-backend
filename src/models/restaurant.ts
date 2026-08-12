import mongoose, { Document, Schema } from "mongoose";

// ─── TypeScript Interface ──────────────────────────────────────────────────────
// Describes the full shape of a Restaurant document.
// The frontend's dummyRestaurant data was used as the reference
// to ensure all required fields are present in the schema.
export interface IRestaurant extends Document {
  name: string;
  slug: string;
  description: string;
  cuisine: string;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  rating: number;
  reviewCount: number;
  location: string;
  address: string;
  image: string;
  chef?: string;
  tags: string[];
  // availableSlots: The time slots this restaurant offers for bookings (e.g. ["18:00", "19:00"]).
  // These are the master time slots, NOT real-time availability.
  // Real-time seat availability is calculated dynamically in the booking controller.
  availableSlots: string[];
  featured: boolean;
  exclusive: boolean;
  // owner: Reference to the User who owns this restaurant.
  // Only used for Owner/Admin flows; kept here for schema integrity.
  owner: mongoose.Types.ObjectId;
  // status: Only 'approved' restaurants are visible to customers.
  status: "pending" | "approved" | "rejected";
  totalSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema Definition ────────────────────────────────────────────────────────
const restaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    // slug: URL-friendly identifier (e.g., "kuro-omakase").
    // The frontend navigates to /restaurant/:slug and /booking/:slug,
    // so the slug must be unique and consistent.
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    cuisine: {
      type: String,
      required: [true, "Cuisine type is required"],
      trim: true,
    },
    priceRange: {
      type: String,
      enum: ["$", "$$", "$$$", "$$$$"],
      required: [true, "Price range is required"],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "/default_restaurant.png",
    },
    chef: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    availableSlots: {
      type: [String],
      default: [],
      // Example: ["18:00", "19:00", "20:00"]
    },
    featured: {
      type: Boolean,
      default: false,
    },
    exclusive: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User", // References the User model
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    totalSeats: {
      type: Number,
      required: [true, "Total seats are required"],
      min: [1, "Must have at least 1 seat"],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Index: Fast Text Search ──────────────────────────────────────────────────
// This compound index enables fast full-text searches on name, cuisine,
// location, and tags — powering the customer-facing Search page.
restaurantSchema.index({ name: "text", cuisine: "text", location: "text", tags: "text" });

const Restaurant = mongoose.model<IRestaurant>("Restaurant", restaurantSchema);
export default Restaurant;
