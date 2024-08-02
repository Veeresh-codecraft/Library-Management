import { readChar, readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
import { IBookBase, IBook } from "./models/books.model";
import { BookRepository } from "./books.repository";
import { Menu } from "../../core/menu";
import { getEditableInput } from "../../core/print.utils";
import { Database } from "../../db/db";
import * as readline from "readline";
import { handleDatabaseOperation } from "../diLayer";
import { QueryResult, ResultSetHeader, RowDataPacket } from "mysql2";
import { SimpleWhereExpression } from "../../libs/types";
import { MySql2Database } from "drizzle-orm/mysql2";
const menu = new Menu("Book Management", [
  { key: "1", label: "Add Book" },
  { key: "2", label: "Edit Book" },
  { key: "3", label: "Delete Book" },
  { key: "4", label: "Search Book" },
  { key: "5", label: "List Book" },
  { key: "6", label: "<Previous Menu>" },
]);

export class BookInteractor implements IInteractor {
  constructor(private readonly db: MySql2Database<Record<string, unknown>>) {}
  private repo = new BookRepository(this.db);

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await menu.show();
      if (op) {
        switch (op?.key.toLowerCase()) {
          case "1":
            await addBook(this.repo);
            break;
          case "2":
            await updateBook(this.repo);
            break;
          case "3":
            await deleteBook(this.repo);
            break;
          case "4":
            await searchByKeyWord(this.repo);
            //console.table(this.repo.list({ limit: 1000, offset: 0 }).items);
            break;
          case "5":
            await showPaginatedBooks(this.repo);
            break;
          case "6":
            loop = false;
            break;
          default:
            console.log("\nInvalid input\n\n");
            break;
        }
      } else {
        console.log("\nInvalid input\n\n");
      }
    }
  }
}

async function getBookInput(): Promise<IBookBase> {
  const title = await readLine(`Please enter title:`);
  const author = await readLine(`Please enter author:`);
  const publisher = await readLine(`Please enter publisher:`);
  const genre = await readLine(`Please enter genre:`);
  const isbnNo = await readLine(`Please enter isbnNo:`);
  const numofPages = +(await readLine(`Please enter number of pages:`));
  const totalNumberOfCopies = +(await readLine(
    `Please enter total num of Copies:`
  ));

  return {
    title: title,
    author: author,
    publisher: publisher,
    genre: genre,
    isbnNo: isbnNo,
    numofPages: numofPages,
    totalNumberOfCopies: totalNumberOfCopies,
  };
}

async function addBook(repo: BookRepository) {
  const book: IBookBase = await getBookInput();

  const createdBook = await repo.create(book);
  if (createdBook) {
    console.log("Book inserted Successfully...");
    console.log("Book ID: ", createdBook.id);
    console.table(createdBook);
    const isMoreBook = await readChar("Any more book to add??(y/n): ");
    if (isMoreBook === "y") {
      await addBook(repo);
    } else if (isMoreBook === "n") {
      console.log("Returning to Book Menu \n");
    }
  }
}

async function updateBook(repo: BookRepository) {
  const id = +(await readLine("Please enter the ID of the book to update:"));
  const book = await repo.getById(id)!;
  if (!book) {
    console.log(`Book with ID ${id} not found.`);
    return;
  }
  book.title = await getEditableInput("Please updated title: ", book.title);
  book.author = await getEditableInput("Please updated author: ", book.author);
  book.publisher = await getEditableInput(
    "Please updated publisher: ",
    book.publisher
  );
  book.genre = await getEditableInput("Please updated genre: ", book.genre);
  book.isbnNo = await getEditableInput("Please updated ISBN.NO: ", book.isbnNo);
  book.numofPages = +(await getEditableInput(
    "Please updated number of pages: ",
    book.numofPages
  ));
  book.totalNumberOfCopies = +(await getEditableInput(
    "Please updated total number of copies: ",
    book.totalNumberOfCopies
  ));
  repo.update(id, book);
  console.log("Updated Successfully");
  console.table(book);
}

async function deleteBook(repo: BookRepository) {
  const bookId = await readLine(`Please enter book id to delete:`);
  const deletedBook = await repo.delete(+bookId);
  console.log("Book deleted successfully\nDeleted Book:");
  console.table(deletedBook);
}

async function showPaginatedBooks(repo: BookRepository): Promise<void> {
  let offset = 0;
  const limit = 10; // Number of items per page

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  const handleKeyPress = async (
    chunk: Buffer,
    key: { name: string; sequence: string }
  ) => {
    if (key.name === "q") {
      rl.close();
      return;
    }

    const response = await repo.list({ limit, offset });

    if (key.name === "right" && response.pagination.hasNext) {
      offset += limit;
    } else if (key.name === "left" && response.pagination.hasPrevious) {
      offset -= limit;
    } else if (key.name === "q") {
      rl.close();
      return; // Exit the function to return to the books menu
    }

    showPage();
  };

  const showPage = async () => {
    const response = await repo.list({ limit, offset });

    console.clear();
    console.table(response.items);
    // console.log(
    //   `Page ${Math.floor(offset / limit) + 1} of ${Math.ceil(
    //     response.pagination.total / limit
    //   )}`
    // );
    console.log(
      `Press '→' for next page, '←' for previous page, or 'q' to quit.`
    );
  };

  process.stdin.on("keypress", handleKeyPress);
  await showPage();

  await new Promise<void>((resolve) => {
    rl.on("close", resolve);
  });

  process.stdin.removeListener("keypress", handleKeyPress);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.resume();
}

//debouncing
function debounce(fn: Function, delay: number) {
  let timer: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function searchByKeyWord(repo: BookRepository) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  let searchQuery = "";
  let offset = 0;
  const limit = 10; // Number of items per page
  let totalBooks = 0;
  let searching = false; // Flag to toggle between search and pagination modes
  let selectedBookIndex = 0;
  let books: any[] = [];

  const displayBooks = async () => {
    readline.cursorTo(process.stdout, 0, 1);
    readline.clearScreenDown(process.stdout);

    if (searchQuery.length > 0) {
      // Search mode
      try {
        readline.clearScreenDown(process.stdout);
        books = await repo.searchByKeyword(searchQuery);
        totalBooks = books.length;
        const topResults = books.slice(0, 5); // Displaying only the top 5 results

        console.log("\n");
        console.log(`Search results for "${searchQuery}":`);
        console.table(
          topResults.map((book, index) => ({
            Selected: index === selectedBookIndex ? "←" : "",
            ...book,
          }))
        );
        console.log(
          `Press '0' to exit. Use '↑'/'↓' to navigate, 'Enter' to select.`
        );
      } catch (err) {
        console.error("Error searching books:", err);
      }
    }

    readline.cursorTo(process.stdout, 0, 0);

    process.stdout.write(`Press '0' to exit\nSearch: ${searchQuery}\n`);
  };

  const handleKeyPress = debounce(
    async (key: { name?: string; sequence?: string }) => {
      if (!key) return;

      if (key.sequence === "0") {
        readline.clearScreenDown(process.stdout);
        rl.close();
        return; // Exit the search
      } else if (key.sequence === "\b" || key.sequence === "\u007F") {
        // Handle backspace
        searchQuery = searchQuery.slice(0, -1);
        offset = 0; // Reset offset on query change
        searching = searchQuery.length > 0;
        selectedBookIndex = 0; // Reset selection index
      } else if (/^[a-zA-Z0-9 ]$/.test(key.sequence || "")) {
        searchQuery += key.sequence || "";
        offset = 0; // Reset offset on query change
        searching = true;
        selectedBookIndex = 0; // Reset selection index
      } else if (
        !searching &&
        key.name === "right" &&
        offset + limit < totalBooks
      ) {
        offset += limit;
        await displayBooks();
      } else if (!searching && key.name === "left" && offset > 0) {
        offset -= limit;
        await displayBooks();
      } else if (key.name === "up" && selectedBookIndex > 0) {
        selectedBookIndex--;
      } else if (
        key.name === "down" &&
        selectedBookIndex < Math.min(searching ? 5 : limit, books.length) - 1
      ) {
        selectedBookIndex++;
      } else if (key.name === "return") {
        console.clear();
        if (books[selectedBookIndex]) {
          console.log(`Selected Book:`);
          console.table([books[selectedBookIndex]]);
        }
        return;
      }

      await displayBooks();
    },
    300 // Debounce delay in milliseconds
  );

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on("keypress", (str, key) => {
    handleKeyPress(key);
  });

  console.clear();
  process.stdout.write(`Search: ${searchQuery}`);
  console.log(`\nStart typing to search... (Press '0' to exit)`);

  await displayBooks();

  await new Promise<void>((resolve) => {
    rl.on("close", resolve);
  });

  process.stdin.removeListener("keypress", (str, key) => {
    handleKeyPress(key);
  });

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.resume();
}
