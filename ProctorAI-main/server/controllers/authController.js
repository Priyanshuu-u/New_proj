import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken } from "../utils/tokens.js";

export async function register(req, res) {
  const { name, email, password, batch, role, institution } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "name, email, and password are required" });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const userRole = role === "examiner" ? "examiner" : "student";

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: userRole,
    batch: userRole === "student" ? (batch || "").trim().toLowerCase() : "",
    institution: userRole === "examiner" ? (institution || "").trim() : "",
  });

  return res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password || "", user.password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return res.json({
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function refresh(req, res) {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ message: "refreshToken is required" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = signAccessToken(user);
    return res.json({ accessToken });
  } catch (_error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}
