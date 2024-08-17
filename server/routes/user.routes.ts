import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controller";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { DrizzleManager } from "../../src/drizzleDbConnection";
import { UserRepository } from "../../src/user-management/user.repository";
const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const userRepository = new UserRepository(db);

export const userRouter = Router();
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
function express() {
  throw new Error("Function not implemented.");
}

// Google OAuth login
userRouter.get("/auth/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
  });
  res.redirect(authUrl);
});

// Google OAuth callback
userRouter.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send("Missing code");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const idToken = tokens.id_token as string;

    if (!idToken) {
      throw new Error("ID token is missing from the tokens");
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Payload is missing from the ID token verification");
    }

    const email = payload.email as string;
    const user = await userRepository.findByEmail(email);

    if (user) {
      const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!);
      return res.json({ token });
    } else {
      const newUser = await userRepository.create({
        username: payload.name || "",
        email,
        passwordHash: "", // No password for OAuth users
        role: "user",
      });
      const token = jwt.sign(
        { userId: newUser.userId },
        process.env.JWT_SECRET!
      );
      return res.json({ token });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).send("Authentication error");
  }
});
