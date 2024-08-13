import { Router } from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controller";
import cookieParser from "cookie-parser";

export const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
function express() {
  throw new Error("Function not implemented.");
}
