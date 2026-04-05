import { Router } from "express";
import { login, refresh, register } from "../controllers/authController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));

export default router;
