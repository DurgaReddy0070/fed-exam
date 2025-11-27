// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================
// In-memory "Database"
// ==========================
let vehicles = [
  { id: 1, regNumber: "AP01AB1234", model: "Swift", owner: "Reddy" }
];

let bookings = [];
let nextVehicleId = 2;
let nextBookingId = 1;

// ==========================
// Utility Functions
// ==========================
function getUpcomingBookings() {
  const today = new Date().toISOString().slice(0, 10);
  return bookings.filter(
    (b) =>
      b.serviceDate >= today &&
      (b.status === "Scheduled" || b.status === "Pending")
  );
}

// ==========================
// Routes
// ==========================

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Vehicle Service Booking API is running" });
});

// Summary
app.get("/api/summary", (req, res) => {
  res.json({
    totalVehicles: vehicles.length,
    totalBookings: bookings.length,
    upcomingServices: getUpcomingBookings().length,
  });
});

// ===== VEHICLES =====

// GET /api/vehicles
app.get("/api/vehicles", (req, res) => {
  res.json(vehicles);
});

// POST /api/vehicles
app.post("/api/vehicles", (req, res) => {
  const { regNumber, model, owner } = req.body;
  if (!regNumber || !model || !owner) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const v = { id: nextVehicleId++, regNumber, model, owner };
  vehicles.push(v);
  res.status(201).json(v);
});

// PATCH /api/vehicles/:id
app.patch("/api/vehicles/:id", (req, res) => {
  const id = Number(req.params.id);
  const vehicle = vehicles.find((v) => v.id === id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  const { regNumber, model, owner } = req.body;
  if (regNumber !== undefined) vehicle.regNumber = regNumber;
  if (model !== undefined) vehicle.model = model;
  if (owner !== undefined) vehicle.owner = owner;

  res.json(vehicle);
});

// DELETE /api/vehicles/:id
app.delete("/api/vehicles/:id", (req, res) => {
  const id = Number(req.params.id);
  const exists = vehicles.some((v) => v.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  vehicles = vehicles.filter((v) => v.id !== id);
  bookings = bookings.filter((b) => b.vehicleId !== id); // delete its bookings
  res.status(204).send();
});

// ===== BOOKINGS =====

// GET /api/bookings  (optionally ?upcoming=true)
app.get("/api/bookings", (req, res) => {
  const { upcoming } = req.query;
  if (upcoming === "true") {
    return res.json(getUpcomingBookings());
  }
  res.json(bookings);
});

// POST /api/bookings
app.post("/api/bookings", (req, res) => {
  const { vehicleId, serviceDate, description, status } = req.body;

  if (!vehicleId || !serviceDate || !description || !status) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const vehicleExists = vehicles.some((v) => v.id === Number(vehicleId));
  if (!vehicleExists) {
    return res.status(400).json({ error: "Invalid vehicleId" });
  }

  const b = {
    id: nextBookingId++,
    vehicleId: Number(vehicleId),
    serviceDate,
    description,
    status,
  };
  bookings.push(b);
  res.status(201).json(b);
});

// PATCH /api/bookings/:id
app.patch("/api/bookings/:id", (req, res) => {
  const id = Number(req.params.id);
  const booking = bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  const { vehicleId, serviceDate, description, status } = req.body;
  if (vehicleId !== undefined) booking.vehicleId = Number(vehicleId);
  if (serviceDate !== undefined) booking.serviceDate = serviceDate;
  if (description !== undefined) booking.description = description;
  if (status !== undefined) booking.status = status;

  res.json(booking);
});

// DELETE /api/bookings/:id
app.delete("/api/bookings/:id", (req, res) => {
  const id = Number(req.params.id);
  const exists = bookings.some((b) => b.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Booking not found" });
  }
  bookings = bookings.filter((b) => b.id !== id);
  res.status(204).send();
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
