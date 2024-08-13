import { Request, Response } from "express";
import { hashPassword, comparePassword } from "../utils/passwordHashing";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwtTokenGenerators";
import { DrizzleManager } from "../../src/drizzleDbConnection";
import { usersTable } from "../../src/drizzle/schema";
import { eq } from "drizzle-orm";

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

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (!user) return res.status(400).json({ message: "User not found" });

    const isPasswordValid = await comparePassword(
      passwordHash,
      user[0].passwordHash
    );
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user[0]);
    const refreshToken = generateRefreshToken(user[0]);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};
