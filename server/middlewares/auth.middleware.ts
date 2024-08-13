import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserPayload } from "../../oldServer/dump/middlewares/middlewares/auth.middleware";
import "dotenv/config";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || "default_access_token_secret";
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        if (
          err.name === "TokenExpiredError" ||
          err.name === "JsonWebTokenError"
        ) {
          const refreshToken = req.cookies.refreshToken;
          //TODO:verify fro jwt.verify(refreshToken, refreshTokenSecret, (refreshErr, user)
          //if it is present then update postman gloable varibale
        }
        return res.sendStatus(403);
      }
      req.user = user as UserPayload;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (roles.includes(req.user!.role)) {
      next();
    } else {
      res.sendStatus(403);
    }
  };
};
