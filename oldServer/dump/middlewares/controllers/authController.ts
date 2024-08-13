import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppEnvs } from "../../../../server/read-env";
import { UserPayload } from "../middlewares/auth.middleware";
import { DrizzleManager } from "../../../../src/drizzleDbConnection";
import { usersTable } from "../../../../src/drizzle/schema";
import { and, eq } from "drizzle-orm";

// Helper function to verify password (consider using bcrypt for hashing)
const verifyPassword = (
  inputPassword: string,
  storedPasswordHash: string
): boolean => {
  // Implement your password verification logic here
  // This is a simplified example; consider using bcrypt for hashing and comparison
  return inputPassword === storedPasswordHash;
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const drizzleManager = new DrizzleManager();
  const db = drizzleManager.getPoolDrizzle();

  try {
    // Find user by username
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1)
      .execute();

    if (!user.length || !verifyPassword(password, user[0].passwordHash)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload: UserPayload = {
      userId: user[0].userId,
      role: user[0].role,
    };

    const accessToken = jwt.sign(payload, AppEnvs.JWT_SECRET, {
      expiresIn: AppEnvs.JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(payload, AppEnvs.JWT_REFRESH_SECRET, {
      expiresIn: AppEnvs.JWT_REFRESH_EXPIRES_IN,
    });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  jwt.verify(
    refreshToken,
    AppEnvs.JWT_REFRESH_SECRET,
    (err, user: UserPayload | undefined) => {
      if (err || !user) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const newAccessToken = jwt.sign(user, AppEnvs.JWT_SECRET, {
        expiresIn: AppEnvs.JWT_EXPIRES_IN,
      });

      res.json({ accessToken: newAccessToken });
    }
  );
};
