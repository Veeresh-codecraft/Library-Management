import jwt from "jsonwebtoken";

export const generateToken = (userId: number) => {
  return jwt.sign({ userId }, "your_secret_key", { expiresIn: "1h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, "your_secret_key");
};
