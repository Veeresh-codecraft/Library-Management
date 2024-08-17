import { Request, Response } from "express";
import { hashPassword, comparePassword } from "../utils/passwordHashing";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwtTokenGenerators";
import { DrizzleManager } from "../../src/drizzleDbConnection";
import { usersTable, refreshTokensTable } from "../../src/drizzle/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import axios from "axios";
import "dotenv/config";

const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();

interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
  enabled?: boolean;
}

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
  const postmanAPIKey = process.env.POSTMAN_API_KEY;
  const environmentUID = process.env.POSTMAN_ENVIRONMENT_UID;

  if (!postmanAPIKey || !environmentUID) {
    return res
      .status(500)
      .json({ message: "Postman API configuration missing" });
  }

  try {
    // Fetch the environment
    const getEnvResponse = await axios.get(
      `https://api.getpostman.com/environments/${environmentUID}`,
      {
        headers: {
          "X-Api-Key": postmanAPIKey,
        },
      }
    );

    if (getEnvResponse.status !== 200) {
      console.error(
        "Failed to retrieve environment:",
        getEnvResponse.statusText
      );
      return res
        .status(400)
        .json({ message: "Failed to retrieve environment" });
    }

    const environment = getEnvResponse.data.environment;

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

    // Check if the accessToken variable already exists, and update it
    let variableExists = false;
    const updatedVariables = environment.values.map(
      (variable: PostmanVariable) => {
        if (variable.key === "accessToken") {
          variableExists = true;
          return {
            ...variable,
            value: accessToken,
          };
        }
        return variable;
      }
    );

    // If accessToken variable doesn't exist, add it
    if (!variableExists) {
      updatedVariables.push({
        key: "accessToken",
        value: accessToken,
        type: "string", // Optional, specify type as string
      });
    }

    // Update the environment with the new accessToken
    const updateEnvResponse = await axios.put(
      `https://api.getpostman.com/environments/${environmentUID}`,
      {
        environment: {
          ...environment,
          values: updatedVariables,
        },
      },
      {
        headers: {
          "X-Api-Key": postmanAPIKey,
        },
      }
    );

    if (updateEnvResponse.status !== 200) {
      console.error(
        "Failed to update environment:",
        updateEnvResponse.statusText
      );
      return res.status(400).json({ message: "Failed to update environment" });
    }

    // Store the refresh token in the database
    const ip = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.ip, req.ip!.toString()));
    await (await db).insert(refreshTokensTable).values({
      userId: user.userId,
      token: refreshToken,
      issuedAt: sql`NOW()`,
      expiresAt: sql`NOW() + INTERVAL 7 DAY`,
      ip: req.ip,
    });

    // Set the refreshToken cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Send response with tokens
    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Error during login process:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const postmanAPIKey = process.env.POSTMAN_API_KEY;
  const environmentUID = process.env.POSTMAN_ENVIRONMENT_UID;

  if (!postmanAPIKey || !environmentUID) {
    return res
      .status(500)
      .json({ message: "Postman API configuration missing" });
  }

  try {
    const refreshToken = req.cookies.refreshToken;

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
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Fetch the Postman environment
    const getEnvResponse = await axios.get(
      `https://api.getpostman.com/environments/${environmentUID}`,
      {
        headers: {
          "X-Api-Key": postmanAPIKey,
        },
      }
    );

    if (getEnvResponse.status !== 200) {
      console.error(
        "Failed to retrieve environment:",
        getEnvResponse.statusText
      );
      return res
        .status(400)
        .json({ message: "Failed to retrieve environment" });
    }

    const environment = getEnvResponse.data.environment;

    // Update the accessToken variable to an empty string
    const updatedVariables = environment.values.map(
      (variable: PostmanVariable) => {
        if (variable.key === "accessToken") {
          return {
            ...variable,
            value: "", // Set the value to an empty string
          };
        }
        return variable;
      }
    );

    // Update the environment with the new empty accessToken
    const updateEnvResponse = await axios.put(
      `https://api.getpostman.com/environments/${environmentUID}`,
      {
        environment: {
          ...environment,
          values: updatedVariables,
        },
      },
      {
        headers: {
          "X-Api-Key": postmanAPIKey,
        },
      }
    );

    if (updateEnvResponse.status !== 200) {
      console.error(
        "Failed to update environment:",
        updateEnvResponse.statusText
      );
      return res.status(400).json({ message: "Failed to update environment" });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Error during logout process:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
