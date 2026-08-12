import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db";
import User from "./models/user";
import Restaurant from "./models/restaurant";
import Booking from "./models/booking";

dotenv.config();

const sampleRestaurants = [
  {
    name: "L'Essence",
    slug: "l-essence",
    description:
      "An intimate, Parisian-inspired fine dining chamber wrapped in dark velvet and soft golden candle glow. L'Essence specializes in meticulous plating of haute gastronomy.",
    cuisine: "French",
    priceRange: "$$$$",
    rating: 4.9,
    reviewCount: 88,
    location: "Manhattan, NY",
    address: "115 Greenwich St, New York, NY 10006",
    image: "/restaurant_5.png",
    chef: "Jean-Luc Picard",
    tags: ["Romantic", "Velvet Booths", "Candlelit", "Haute Cuisine"],
    availableSlots: ["18:00", "19:00", "20:00", "21:00", "22:00"],
    featured: true,
    exclusive: false,
    status: "approved",
    totalSeats: 45,
  },
  {
    name: "Terraza Cielo",
    slug: "terraza-cielo",
    description:
      "A sun-drenched rooftop oasis celebrating Italian and Mediterranean lifestyles. Featuring floor-to-ceiling foliage, white marble bistro tables, and panoramic skyline views.",
    cuisine: "Italian",
    priceRange: "$$$",
    rating: 4.7,
    reviewCount: 205,
    location: "Manhattan, NY",
    address: "244 Fifth Ave Rooftop, New York, NY 10001",
    image: "/restaurant_3.jpg",
    chef: "Elena Rossi",
    tags: ["Rooftop", "Skyline Views", "Handmade Pasta", "Craft Cocktails"],
    availableSlots: ["12:00", "13:00", "17:00", "18:00", "19:00", "20:00", "21:00"],
    featured: true,
    exclusive: false,
    status: "approved",
    totalSeats: 30,
  },
  {
    name: "Kuro Omakase",
    slug: "kuro-omakase",
    description:
      "An atmospheric, moody sanctuary of premium Japanese gastronomy. Seated at a dark, polished basalt-stone counter, guests experience a deeply focused sushi omakase.",
    cuisine: "Japanese",
    priceRange: "$$$$",
    rating: 4.8,
    reviewCount: 92,
    location: "Manhattan, NY",
    address: "18 Orchard St, New York, NY 10002",
    image: "/restaurant_2.jpg",
    chef: "Kenji Sato",
    tags: ["Omakase", "Basalt Counter", "Japanese", "Zen Atmosphere"],
    availableSlots: ["18:00", "20:30"],
    featured: true,
    exclusive: true,
    status: "approved",
    totalSeats: 25,
  },
  {
    name: "Flora Garden",
    slug: "flora-garden",
    description:
      "A bright, airy conservatory celebrating organic, plant-forward gastronomy. Nestled under glass ceilings with floor-to-ceiling botanicals.",
    cuisine: "Vegetarian",
    priceRange: "$$$",
    rating: 4.8,
    reviewCount: 110,
    location: "Manhattan, NY",
    address: "90 Grand St, New York, NY 10013",
    image: "/restaurant_6.png",
    chef: "Chloe Mercer",
    tags: ["Plant-Based", "Glasshouse", "Organic", "Bright & Airy"],
    availableSlots: ["11:30", "13:00", "14:30", "17:30", "19:00", "20:30"],
    featured: false,
    exclusive: false,
    status: "approved",
    totalSeats: 40,
  },
  {
    name: "Ember Grille",
    slug: "ember-grille",
    description:
      "An upscale modern steakhouse with exposed brick walls, leather booths, and warm, industrial-chic pendant lighting. Offering Prime dry-aged cuts.",
    cuisine: "Steakhouse",
    priceRange: "$$$$",
    rating: 4.6,
    reviewCount: 142,
    location: "Manhattan, NY",
    address: "320 Bowery, New York, NY 10012",
    image: "/restaurant_1.png",
    chef: "Marcus Vance",
    tags: ["Dry-Aged Beef", "Wood Fire", "Moody Lighting", "Wine Room"],
    availableSlots: ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
    featured: false,
    exclusive: false,
    status: "approved",
    totalSeats: 35,
  },
  {
    name: "L'Artiste",
    slug: "l-artiste",
    description:
      "An avant-garde journey through modern French gastronomy. L'Artiste blends classic French culinary foundations with contemporary visual artistry.",
    cuisine: "French",
    priceRange: "$$$$",
    rating: 4.9,
    reviewCount: 124,
    location: "Manhattan, NY",
    address: "420 Mercer St, New York, NY 10003",
    image: "/restaurant_4.png",
    chef: "Jean-Pierre Dubois",
    tags: ["Michelin Star", "Fine Dining", "Tasting Menu", "Romantic"],
    availableSlots: ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"],
    featured: true,
    exclusive: true,
    status: "approved",
    totalSeats: 20,
  },
];

const seedData = async () => {
  try {
    await connectDB();

    console.log("🧹 Clearing old data...");
    await Restaurant.deleteMany({});
    await Booking.deleteMany({});
    await User.deleteMany({ email: "testuser@example.com" });

    console.log("👤 Creating test customer user...");
    const user = await User.create({
      name: "Test Customer",
      email: "testuser@example.com",
      password: "password123",
      phone: "+1555123456",
      role: "user",
    });

    console.log("🏪 Seeding restaurants...");
    const restaurantsWithOwners = sampleRestaurants.map((r) => ({
      ...r,
      owner: user._id, // Assign dummy owner reference
    }));

    await Restaurant.insertMany(restaurantsWithOwners);

    console.log("✅ Database successfully seeded with 6 approved restaurants!");
    console.log(`🔑 Test Login Email: testuser@example.com`);
    console.log(`🔑 Test Login Password: password123`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
