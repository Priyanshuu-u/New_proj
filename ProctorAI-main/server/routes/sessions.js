import { Router } from "express";
import {
  getExaminerReport,
  getMySessionByTest,
  getSessionById,
  getSessionsByTest,
  logViolation,
  startSession,
  submitSession,
} from "../controllers/sessionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.use(authMiddleware);

router.post("/start", requireRole("student"), asyncHandler(startSession));
router.post("/:id/submit", requireRole("student"), asyncHandler(submitSession));
router.get(
  "/test/:testId",
  requireRole("examiner"),
  asyncHandler(getSessionsByTest),
);
router.get(
  "/my/:testId",
  requireRole("student"),
  asyncHandler(getMySessionByTest),
);
router.get("/:id/report", asyncHandler(getExaminerReport));
router.get("/:id", asyncHandler(getSessionById));
router.post(
  "/:id/violation",
  requireRole("student"),
  asyncHandler(logViolation),
);

export default router;
