import {
  HTTPServer,
  RequestProcessor,
  CustomRequest,
  CustomResponse,
} from "./newServer";
import { DrizzleManager } from "../src/drizzleDbConnection";
import { BookRepository } from "../src/book-management/books.repository";
import { IncomingMessage, ServerResponse } from "http";
import { IBook } from "../src/book-management/models/books.model";

// Define port number
const port: number = 3000;

// Create instances
const server = new HTTPServer(port);
const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const repo = new BookRepository(db);

// Extend the IncomingMessage interface to include a body property
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
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", (error) => {
      reject(error);
    });
  });
};

// Global Middleware: Applies to all requests
const globalMiddleware: RequestProcessor = (request, response, next) => {
  console.log(`Request received: ${request.method} ${request.url}`);
  response.setHeader("X-Powered-By", "Node.js");
  next();
};

// Middleware to parse JSON body
const jsonParserMiddleware: RequestProcessor = async (
  request,
  response,
  next
) => {
  try {
    if (["POST", "PATCH"].includes(request.method ?? "")) {
      request.body = await extractJson(request);
    }
    next();
  } catch (error) {
    console.error("Error parsing JSON:", error);
    if (!response.headersSent) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  }
};

// Middleware to validate book data
const validateBookDataMiddleware: RequestProcessor = (
  request,
  response,
  next
) => {
  if (request.method === "POST" || request.method === "PATCH") {
    const body = request.body;

    // Define the expected keys and their types
    const isValidBook = (data: any): data is Omit<IBook, "id"> => {
      return (
        typeof data.title === "string" &&
        typeof data.author === "string" &&
        typeof data.publisher === "string" &&
        typeof data.genre === "string" &&
        typeof data.isbnNo === "string" &&
        typeof data.numofPages === "number" &&
        typeof data.totalNumberOfCopies === "number" &&
        typeof data.availableNumberOfCopies === "number"
      );
    };

    // Check if the body is valid
    if (!isValidBook(body)) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Invalid book data format" }));
      return;
    }
  }

  next();
};

// Route Handlers
const getAllBooks: RequestProcessor = async (request, response) => {
  try {
    console.log("Fetching books...");

    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const idParam = url.searchParams.get("id");

    if (idParam) {
      const id = parseInt(idParam, 10);
      const book = await repo.getById(id);

      if (!book) {
        response.writeHead(404, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Book not found" }));
      } else {
        console.log("Book fetched successfully:", book);
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(book));
      }
    } else {
      const pageParam = url.searchParams.get("page");
      const limitParam = url.searchParams.get("limit");

      const page = parseInt(pageParam ?? "1", 10);
      const limit = parseInt(limitParam ?? "10", 10);
      const offset = (page - 1) * limit;

      console.log(`Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

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
    const body = request.body;
    console.log("Creating book with data:", body);

    if (!body) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "No book data provided" }));
      return;
    }

    const result = await repo.create(body);
    console.log("Book created successfully:", result);
    response.writeHead(201, { "Content-Type": "application/json" });
    response.end(JSON.stringify(result));
  } catch (error) {
    console.error("Error creating book:", error);
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        })
      );
    }
  }
};

const updateBook: RequestProcessor = async (request, response) => {
  try {
    const body = request.body;

    // Extract the book ID from the URL query parameters
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const idParam = url.searchParams.get("id");

    // Check if the book ID is provided and is valid
    if (!idParam || isNaN(Number(idParam))) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Valid book ID is required" }));
      return;
    }

    const id = parseInt(idParam, 10);

    // Validate that the body contains data to update
    if (!body || Object.keys(body).length === 0) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "No data provided for update" }));
      return;
    }

    // Include the ID in the body if not already present
    body.id = id;

    // Perform the update operation
    const result = await repo.update(id, body);

    // Check if the update was successful
    if (!result) {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Book not found" }));
      return;
    }

    console.log("Book updated successfully:", result);
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(result));
  } catch (error) {
    console.error("Error updating book:", error);
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        })
      );
    }
  }
};

const deleteBook: RequestProcessor = async (request, response) => {
  try {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const idParam = url.searchParams.get("id");

    if (!idParam) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Book ID is required" }));
      return;
    }

    const id = parseInt(idParam, 10);
    const book = await repo.getById(id);

    if (!book) {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Book not found" }));
      return;
    }

    const result = await repo.delete(id);

    if (!result) {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Book not found" }));
    } else {
      console.log("Book deleted successfully:", book);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({ message: "Book deleted successfully", book })
      );
    }
  } catch (error) {
    console.error("Error deleting book:", error);
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        })
      );
    }
  }
};

// Apply middleware
server.use(globalMiddleware);
server.use(jsonParserMiddleware);

// Register routes with validation where needed
server.post("/books", validateBookDataMiddleware, createBook);
server.get("/books", getAllBooks);
server.patch("/books", validateBookDataMiddleware, updateBook);
server.delete("/books", deleteBook);

console.log(`Server running on port ${port}`);
