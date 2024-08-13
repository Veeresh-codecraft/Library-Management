import { Request, Response } from "express";
import { hashPassword, comparePassword } from "../utils/passwordHashing";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwtTokenGenerators";
import { DrizzleManager } from "../../src/drizzleDbConnection";
import { usersTable, refreshTokensTable } from "../../src/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    const hashedPassword = await hashPassword(password);
    const newUser = {
      username,
      email,
      passwordHash: hashedPassword,
      role,
    };

    await (await db).insert(usersTable).values(newUser);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, passwordHash } = req.body;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (!user) return res.status(400).json({ message: "User not found" });

    const isPasswordValid = await comparePassword(
      passwordHash,
      user.passwordHash
    );
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store the refresh token in the refreshTokensTable
    await (await db).insert(refreshTokensTable).values({
      userId: user.userId,
      token: refreshToken,
      issuedAt: sql`NOW()`,
      expiresAt: sql`NOW() + INTERVAL 7 DAY`,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // use secure cookies in production
      sameSite: "strict",
    });
    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    console.log(refreshToken);

    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token provided" });
    }

    // Delete the refresh token from the database
    await db
      .delete(refreshTokensTable)
      .where(eq(refreshTokensTable.token, refreshToken));

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // use secure cookies in production
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
