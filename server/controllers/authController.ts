// authController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserRepository } from "../../src/user-management/user.repository";
import { MySql2Database } from "drizzle-orm/mysql2";
import { DrizzleManager } from "../../src/drizzleDbConnection";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwtUtils";

const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const userRepository = new UserRepository(db);

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await userRepository.getByEmail(username);

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await userRepository.updateRefreshToken(user.userId, refreshToken);

      return res.json({ accessToken, refreshToken });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Error during login" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const payload = verifyRefreshToken(refreshToken) as any;
    const userId = payload.userId;

    const existingUser = await userRepository.getById(userId);

    if (existingUser) {
      const newAccessToken = generateAccessToken(existingUser);
      return res.json({ accessToken: newAccessToken });
    } else {
      return res.status(403).json({ message: "User not found" });
    }
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};
