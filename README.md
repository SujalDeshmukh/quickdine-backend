# 🍽️ QuickDine Backend API

QuickDine is a robust, production-grade RESTful API built with **Node.js, Express, TypeScript, and MongoDB**. Designed specifically for a customer-first dining platform, it handles user authentication, restaurant search & discovery, dynamic slot capacity calculations, and table reservation management.

---

## 🌟 Key Features

- 🔐 **JWT Authentication & Security**: Secure user registration & login using `bcryptjs` password hashing with pre-save hooks and stateless JWT bearer token authorization.
- ⚡ **Real-Time Slot Availability**: Dynamically computes available table seats per slot using `.reduce()` array aggregations against existing confirmed bookings for that date.
- 🛑 **Double-Booking & Capacity Validation**: Strict server-side validation rejecting reservations that exceed a restaurant's total seating capacity with HTTP 409 Conflict handling.
- 🔍 **Dynamic Search & Filtering**: Supports full-text search across restaurant names, cuisines, locations, and tags using MongoDB text indexing.
- 🛡️ **Ownership Security Guards**: Enforces strict user-level authorization so customers can only access or cancel their own bookings.
- 🆔 **Auto-Generated Reference Codes**: Pre-save model hooks generating unique human-readable booking IDs (e.g. `GR-71B448A7`).

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB & Mongoose ODM
- **Authentication**: JSON Web Tokens (jsonwebtoken) & bcryptjs
- **Environment Management**: dotenv & cors

---

## 📁 Folder Structure
