// authRoutes.ts
import { Router } from "express";
import { login, refreshToken } from "../controllers/authController";
import { validateUser } from "../middlewares/validateUserMiddleware";

const router = Router();

// Routes for authentication
router.post("/login", validateUser, login);
router.post("/refresh-token", refreshToken);

export default router;
