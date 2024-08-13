import { CustomResponse, HTTPServer, RequestProcessor } from "./server";
import { BookRepository } from "../src/book-management/books.repository";
import { IncomingMessage, ServerResponse } from "http";
import { URL } from "node:url";
import { IBookBase } from "../src/book-management/models/books.model";
import { IPageRequest } from "../core/pagination.model";
import { IBook } from "../src/book-management/models/books.model";
import { DrizzleManager } from "../src/drizzleDbConnection";

// Extend IncomingMessage to include a body property
declare module "http" {
  interface IncomingMessage {
    body?: any;
  }
}
const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const bookRepository = new BookRepository(db);

const getBooks: RequestProcessor = async (
  request: IncomingMessage,
  response: CustomResponse,
  next
) => {
  try {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const bookId = url.searchParams.get("id");
    const offset = url.searchParams.get("offset");
    const limit = url.searchParams.get("limit");
    const search = url.searchParams.get("search") || "";

    if (bookId) {
      const book = await bookRepository.getById(Number(bookId));
      response.writeHead(200);
      response.end(JSON.stringify(book));
    } else if (offset !== null && limit !== null) {
      const pageRequest: IPageRequest = {
        offset: Number(offset),
        limit: Number(limit),
        search,
      };
      const paginatedBooks = await bookRepository.list(pageRequest);
      response.writeHead(200);
      response.end(JSON.stringify(paginatedBooks));
    } else {
      const allBooks = await bookRepository.list({}); // Assuming getAll() is implemented in the repository
      response.writeHead(200);
      response.end(JSON.stringify(allBooks));
    }
  } catch (error) {
    response.writeHead(500);
    response.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      })
    );
  }
  next();
};

const createBook: RequestProcessor = async (
  request: IncomingMessage,
  response: CustomResponse,
  next
) => {
  try {
    const bookData: IBookBase = await request.body;
    const newBook = await bookRepository.create(bookData);
    response.writeHead(201);
    response.end(JSON.stringify(newBook));
  } catch (error) {
    response.writeHead(500);
    response.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      })
    );
  }
  next();
};

const updateBook: RequestProcessor = async (
  request: IncomingMessage,
  response: CustomResponse,
  next
) => {
  try {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const bookId = Number(url.searchParams.get("id"));
    const bookData: IBook = await request.body;
    const updatedBook = await bookRepository.update(bookId, bookData);
    response.writeHead(200);
    response.end(JSON.stringify(updatedBook));
  } catch (error) {
    response.writeHead(500);
    response.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      })
    );
  }
  next();
};

const deleteBook: RequestProcessor = async (
  request: IncomingMessage,
  response: CustomResponse,
  next
) => {
  try {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const bookId = Number(url.searchParams.get("id"));
    const deletedBook = await bookRepository.delete(bookId);
    response.writeHead(200);
    response.end(JSON.stringify(deletedBook));
  } catch (error) {
    response.writeHead(500);
    response.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      })
    );
  }
  next();
};

const port = 3000;
const server = new HTTPServer(port);

// Middleware to set headers
server.use((request: IncomingMessage, response: ServerResponse, next) => {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  next();
});

// Middleware to parse JSON body
server.use(
  "/books",
  (request: IncomingMessage, response: ServerResponse, next) => {
    if (request.method === "POST" || request.method === "PATCH") {
      request.body = new Promise((resolve, reject) => {
        let bodyData = "";
        request.on("data", (chunk) => {
          bodyData += chunk.toString();
        });

        request.on("end", async () => {
          try {
            let json = JSON.parse(bodyData);
            resolve(json);
            next();
          } catch (error) {
            response.writeHead(400, { "Content-Type": "application/json" });
            reject(new Error("Invalid JSON data"));
          }
        });
      });
    } else {
      next();
    }
  }
);

// Middleware to validate book data
const validateBookData: RequestProcessor = async (request, response, next) => {
  if (request.method === "POST" || request.method === "PATCH") {
    const body = await request.body;
    try {
      const isValidBook = (data: any): data is Omit<IBook, "id"> => {
        return (
          typeof data.title === "string" &&
          typeof data.author === "string" &&
          typeof data.publisher === "string" &&
          typeof data.genre === "string" &&
          typeof data.isbnNo === "string" &&
          typeof data.numOfPages === "number" &&
          typeof data.totalNumOfCopies === "number" &&
          typeof data.availableNumOfCopies === "number"
        );
      };

      if (!isValidBook(body)) {
        throw new Error("Validation Error");
      }
    } catch (error) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({ error: "Validation Error: Invalid book data" })
      );
      return;
    }
  }
  next();
};

// Registering routes
server.get("/books", getBooks);
server.post("/books", validateBookData, createBook);
server.patch("/books", validateBookData, updateBook);
server.delete("/books", deleteBook);

console.log(`Server running at http://localhost:${port}/`);
