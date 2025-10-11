const express = require("express");
const cors = require("cors");
const db = require("../database/SqliteAuto");
const jwt = require("jsonwebtoken");
const route = express.Router();

route.use(cors());
route.use(express.json());

// Simple in-memory refresh token store (for demo). Replace with DB in production.
const refreshTokens = new Set();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "dev_refresh_secret";

function signAccess(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
}

function signRefresh(user) {
  return jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET, { expiresIn: "7d" });
}

route.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    let userRecord;
    try {
      userRecord = await db.authLogin({ email, password });
    } catch (err) {
      return res.status(400).json({ error: "Incorrect credentials" });
    }

    // Build user object to return (no password)
    const user = { id: userRecord.id, email: userRecord.email };
    const token = signAccess(user);
    const refreshToken = signRefresh(user);
    refreshTokens.add(refreshToken);

    return res.json({ user, token, refreshToken });
  } catch (err) {
    console.error("/auth/login error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

route.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    try {
      await db.authSignUp(email, password);
      return res.json({ Message: "Account Created Successfully" });
    } catch (error) {
      return res.status(400).json({ error: "SignUp Error" });
    }
  } catch (err) {
    console.error("/auth/signup error", err);
    return res.status(500).json({ error: "Signup Error" });
  }
});

route.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
  if (!refreshTokens.has(refreshToken)) return res.status(403).json({ error: "Invalid refresh token" });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = { id: payload.id, email: payload.email };
    const token = signAccess(user);
    const newRefresh = signRefresh(user);
    refreshTokens.delete(refreshToken);
    refreshTokens.add(newRefresh);
    return res.json({ token, refreshToken: newRefresh });
  } catch (err) {
    return res.status(403).json({ error: "Invalid refresh token" });
  }
});

route.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) refreshTokens.delete(refreshToken);
  return res.json({ ok: true });
});

route.get("/test", (req, res) => {
  return res.json({ result: "success" });
});

module.exports = route;
