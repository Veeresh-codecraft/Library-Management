// userRoutes.ts
import { Router } from "express";
import { login, refreshToken } from "../controllers/authController";
import { validateUser } from "../middlewares/validateUserMiddleware";
import { authenticateUser } from "../middlewares/authMiddleware";
import { authorizeRole } from "../middlewares/roleMiddleware";

const router = Router();

// Route for user login
router.post("/login", validateUser, login);

// Route for refreshing access token
router.post("/refresh-token", refreshToken);

export default router;
