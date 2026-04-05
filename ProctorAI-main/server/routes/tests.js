import { Router } from "express";
import {
  createTest,
  deleteTest,
  getTestById,
  getTests,
  updateTest,
} from "../controllers/testController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(getTests));
router.get("/:id", asyncHandler(getTestById));
router.post("/", requireRole("examiner"), asyncHandler(createTest));
router.put("/:id", requireRole("examiner"), asyncHandler(updateTest));
router.delete("/:id", requireRole("examiner"), asyncHandler(deleteTest));

export default router;
