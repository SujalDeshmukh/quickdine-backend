import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// ─── TypeScript Interface ──────────────────────────────────────────────────────
// Describes the shape of a User document as stored in MongoDB.
// The interface extends Mongoose's Document so we get type-safe
// access to built-in Mongoose methods (e.g., .save(), .id).
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  // Role-based access: 'user' is the default (customer).
  // 'owner' and 'admin' exist in the enum for forward-compatibility
  // but are NOT exposed through any customer-facing API route.
  role: "user" | "owner" | "admin";
  createdAt: Date;
  updatedAt: Date;
  // Custom instance method: compares a plain-text password
  // against the stored bcrypt hash. Defined below.
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─── Schema Definition ────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Creates a unique index in MongoDB
      lowercase: true, // Always stored in lowercase to prevent duplicates
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      // 'select: false' means this field is NOT returned in queries by default.
      // You must explicitly request it: User.findById(id).select('+password')
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user", // Every new registration defaults to a customer
    },
  },
  {
    // Mongoose automatically manages 'createdAt' and 'updatedAt' fields.
    timestamps: true,
  }
);

// ─── Pre-Save Hook: Password Hashing ─────────────────────────────────────────
// Flow: BEFORE a user document is saved to MongoDB (.save() is called),
// this middleware checks if the password field was modified. If it was
// (new user or password change), it hashes the plain-text password using
// bcrypt with a salt factor of 12 (strong but still performant).
// This ensures we NEVER store a plain-text password in the database.
userSchema.pre("save", async function (next) {
  // 'this' refers to the current user document being saved.
  // If the password was NOT modified, skip hashing and move to next middleware.
  if (!this.isModified("password")) return next();

  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ─── Instance Method: comparePassword ────────────────────────────────────────
// Flow: Takes a plain-text candidate password from the login form,
// uses bcrypt.compare() to safely compare it against the stored hash,
// and returns a boolean. This is used in the authController login function.
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // 'this.password' is the bcrypt hash stored in the DB.
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
