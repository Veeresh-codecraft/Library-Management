// jwtUtils.ts
import jwt, { JwtPayload } from "jsonwebtoken";
import * as config from "config";

const JWT_SECRET_KEY = config.get<string>("JWT_SECRET_KEY");

export const generateAccessToken = (user: any) => {
  return jwt.sign(
    { userId: user.userId, username: user.username, role: user.role },
    JWT_SECRET_KEY,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user: any) => {
  return jwt.sign(
    { userId: user.userId, username: user.username, role: user.role },
    JWT_SECRET_KEY,
    { expiresIn: "7d" }
  );
};

export const verifyAccessToken = (token: string): JwtPayload | string => {
  try {
    return jwt.verify(token, JWT_SECRET_KEY);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | string => {
  try {
    return jwt.verify(token, JWT_SECRET_KEY);
  } catch (error) {
    throw new Error("Invalid token");
  }
};
