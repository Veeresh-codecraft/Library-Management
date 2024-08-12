import { Request, Response, NextFunction } from 'express';

const globalMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  res.setHeader('X-Powered-By', 'Node.js');
  next();
};

export default globalMiddleware;
