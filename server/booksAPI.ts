import { DrizzleManager } from "../src/drizzleDbConnection";
import { booksTable } from "../src/drizzle/schema";
import { HTTPServer, RequestProcessor } from "./server";
import { IncomingMessage, ServerResponse } from "http";
import { eq } from "drizzle-orm";
import { BookRepository } from "../src/book-management/books.repository";
import { AppEnvs } from "../read-env";
const port: number = 3000;
const server = new HTTPServer(port);
const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const repo = new BookRepository(db);
declare module "http" {
  interface IncomingMessage {
    body?: any;
  }
}

// Utility function to parse JSON body
const extractJson = (request: IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      try {
        const json = JSON.parse(body);
        resolve(json);
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", (error) => {
      reject(error);
    });
  });
};

const getAllBooks: RequestProcessor = async (request, response) => {
  try {
    console.log("Fetching books...");

    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const idParam = url.searchParams.get("id");

    if (idParam) {
      const id = parseInt(idParam, 10);
      // Fetch book by ID
      const book = (await repo.getById(id))!;

      if (book.id) {
        response.writeHead(404, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Book not found" }));
      } else {
        console.log("Book fetched successfully:", book);
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(book));
      }
    } else {
      // Extract pagination parameters from query string
      const page = parseInt(url.searchParams.get("page") ?? "1", 10);
      const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

      // Calculate offset
      const offset = (page - 1) * limit;

      // Fetch books with pagination
      const allBooks = await repo.list({ limit, offset });

      console.log("Books fetched successfully:", allBooks);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(allBooks));
    }
  } catch (error) {
    console.error("Error fetching books:", error);
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      })
    );
  }
};

const createBook: RequestProcessor = async (request, response) => {
  try {
    console.log("Creating book with data:", await request.body);
    if (!request.body) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "No book data provided" }));
      return;
    }
    const book = await request.body;

    const result = await repo.create(book);
    console.log("Book created successfully:", result);
    response.writeHead(201, { "Content-Type": "application/json" });
    response.end(JSON.stringify(result));
  } catch (error) {
    console.error("Error creating book:", error);
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      })
    );
  }
};

const updateBook: RequestProcessor = async (request, response) => {
  try {
    const bookData = await request.body;
    if (!bookData || !bookData.id) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Book ID and data are required" }));
      return;
    }

    const result = await repo.update(bookData.id, bookData);

    if (!result) {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Book not found" }));
    } else {
      console.log("Book updated successfully:", result);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(result));
    }
  } catch (error) {
    console.error("Error updating book:", error);
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      })
    );
  }
};

// Middleware to set headers
const setHeaders: RequestProcessor = (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5173");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, OPTIONS"
  );
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

// Middleware to parse JSON body
const parseJsonBody: RequestProcessor = async (request, response) => {
  if (
    request.method === "POST" ||
    request.method === "PUT" ||
    request.method === "PATCH"
  ) {
    try {
      request.body = extractJson(request);
    } catch (error) {
      console.error("Invalid JSON:", error);
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  }
};

// middleware to set headers and parse JSON body.
server.use(async (request: IncomingMessage, response: ServerResponse) => {
  try {
    setHeaders(request, response);
    parseJsonBody(request, response);
  } catch (error) {
    console.error("Error in middleware:", error);
  }
});

server.get("/books", getAllBooks);
server.post("/books", createBook);
server.patch("/books", updateBook);

console.log(`Server running at http://localhost:${port}/`);
