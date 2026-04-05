import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
