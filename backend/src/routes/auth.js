const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters." });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
      normalizedEmail,
    ]);

    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [String(name).trim(), normalizedEmail, hash]
    );

    const user = {
      id: result.insertId,
      name: String(name).trim(),
      email: normalizedEmail,
    };

    const token = createToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const userRecord = rows[0];
    const passwordOk = await bcrypt.compare(password, userRecord.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = { id: userRecord.id, name: userRecord.name, email: userRecord.email };
    const token = createToken(user);
    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [
      req.user.id,
    ]);
    if (!rows.length) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ user: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load profile.", error: error.message });
  }
});

module.exports = router;
