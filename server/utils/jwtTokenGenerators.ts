import jwt from "jsonwebtoken";
import { IUser } from "../../src/user-management/models/user.model";
import "dotenv/config";

export const generateAccessToken = (user: IUser) => {
  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || "some_default_token";
  return jwt.sign({ id: user.userId, role: user.role }, accessTokenSecret, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (user: IUser) => {
  const refreshTokenSecret =
    process.env.REFRESH_TOKEN_SECRET || "some_default_token";
  return jwt.sign({ id: user.userId }, refreshTokenSecret, { expiresIn: "7d" });
};
