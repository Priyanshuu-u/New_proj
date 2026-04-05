import jwt from "jsonwebtoken";

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}
