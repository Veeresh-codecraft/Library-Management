import express from "express";
import bookRoutes from "./routes/book.routes";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/api", bookRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
