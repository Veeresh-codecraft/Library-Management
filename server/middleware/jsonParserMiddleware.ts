import { Request, Response, NextFunction } from "express";

const jsonParserMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (["POST", "PATCH"].includes(req.method)) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        req.body = JSON.parse(body);
        next();
      } catch (error) {
        console.error("Error parsing JSON:", error);
        res.status(400).json({ error: "Invalid JSON" });
      }
    });
    req.on("error", (error) => {
      res.status(400).json({ error: "Error reading body" });
    });
  } else {
    next();
  }
};

export default jsonParserMiddleware;
