import mongoose, { Document, Schema } from "mongoose";

// ─── TypeScript Interface ──────────────────────────────────────────────────────
// Describes the full shape of a Booking document.
// The frontend's dummyBookingData and dummyMyBookingsData were used
// as references to ensure the shape matches what the UI expects.
export interface IBooking extends Document {
  // bookingId: Human-readable reference number (e.g., "GR-71B448A7").
  // Displayed to the customer on the BookingSuccess screen.
  bookingId: string;
  // user: The customer who made this booking. Stored as a reference
  // so we can populate their name/email when needed.
  user: mongoose.Types.ObjectId;
  // restaurant: The restaurant being booked. Also a reference;
  // when populating, we select only the fields the frontend needs
  // (name, slug, location, address, image, cuisine).
  restaurant: mongoose.Types.ObjectId;
  date: Date;      // The reservation date (time part is ignored; only the date matters)
  time: string;    // The chosen time slot, e.g., "19:00"
  guests: number;  // Number of guests in this booking
  occasion?: string;         // Optional: "Birthday", "Anniversary", etc.
  specialRequests?: string;  // Optional: dietary needs, seating preferences, etc.
  status: "confirmed" | "cancelled" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema Definition ────────────────────────────────────────────────────────
const bookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      unique: true,
      // Generated automatically before save (see pre-save hook below).
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant is required"],
    },
    date: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    time: {
      type: String,
      required: [true, "Booking time slot is required"],
      // Example: "19:00", "20:30"
    },
    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "At least 1 guest is required"],
      max: [20, "Maximum 20 guests per booking"],
    },
    occasion: {
      type: String,
      trim: true,
      default: "",
    },
    specialRequests: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed", // All new bookings start as 'confirmed'
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-Save Hook: Auto-generate bookingId ───────────────────────────────────
// Flow: BEFORE a new booking document is saved for the first time,
// this hook generates a human-readable Booking Reference Number in
// the format "GR-XXXXXXXX" (8 random hex characters, uppercase).
// 'isNew' ensures we only generate it once — not on every update.
bookingSchema.pre("save", function (next) {
  if (this.isNew && !this.bookingId) {
    // Generate 4 random bytes → 8 hex characters → uppercase prefix
    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    this.bookingId = `GR-${randomHex}`;
  }
  next();
});

// ─── Index: Faster Queries ────────────────────────────────────────────────────
// Compound index on (restaurant, date, time) dramatically speeds up
// the slot-availability check performed in the booking controller.
// This is the most frequently queried pattern in the entire app.
bookingSchema.index({ restaurant: 1, date: 1, time: 1 });

// Index on user so "My Bookings" queries are fast.
bookingSchema.index({ user: 1 });

const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
export default Booking;
