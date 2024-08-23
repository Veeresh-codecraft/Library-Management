import express from "express";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../../src/user-management/user.repository";
import { BookRepository } from "../../src/book-management/books.repository";
import { DrizzleManager } from "../../src/drizzleDbConnection";
import { authenticateJWT } from "./auth.middleware";

dotenv.config();

const app = express();
app.use(express.json());

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);
const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const userRepository = new UserRepository(db);
const bookRepository = new BookRepository(db);

// Google OAuth login
app.get("/auth/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
  });
  res.redirect(authUrl);
});

// Google OAuth callback
app.get("/auth/google/callback", async (req, res) => {
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

// Email/password registration
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userRepository.create({
      username,
      email,
      passwordHash: hashedPassword,
      role: "user",
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).send("Registration error");
  }
});

// Email/password login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userRepository.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!);
      res.json({ token });
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (error) {
    res.status(500).send("Login error");
  }
});

// List all books
app.get("/books", authenticateJWT, async (req, res) => {
  console.log("User:", (req as any).user); // Log user information
  try {
    const books = await bookRepository.list({});
    res.json(books);
  } catch (error) {
    console.error("Error retrieving books:", error);
    res.status(500).send(`Error retrieving books: ${error}`);
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
