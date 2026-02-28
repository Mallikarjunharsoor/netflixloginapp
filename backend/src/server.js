const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { initializeDatabase } = require("./db");
const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");

const app = express();
const port = Number(process.env.PORT || 5000);

// Initialize DB globally (Vercel will reuse this connection)
initializeDatabase().catch(err => console.error("DB Error:", err));

app.use(
  cors({
    // IMPORTANT: On Vercel, CLIENT_ORIGIN must be your frontend's Vercel URL
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);

// Only listen if NOT running on Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

// CRUCIAL for Vercel: Export the app
module.exports = app;
