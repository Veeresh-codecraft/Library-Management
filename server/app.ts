import express from "express";
import bookRoutes from "./routes/bookRoutes";
import globalMiddleware from "./middleware/globalMiddleware";
import jsonParserMiddleware from "./middleware/jsonParserMiddleware";

const app = express();

// Apply global middleware
app.use(globalMiddleware);
app.use(jsonParserMiddleware);

// Apply routes
app.use("/books", bookRoutes);

export default app;
