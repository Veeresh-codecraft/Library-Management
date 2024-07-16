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
const menu = new Menu("Book Management", [
  { key: "1", label: "Add Book" },
  { key: "2", label: "Edit Book" },
  { key: "3", label: "Delete Book" },
  { key: "4", label: "Search Book" },
  { key: "5", label: "List Book" },
  { key: "6", label: "<Previous Menu>" },
]);

export class BookInteractor implements IInteractor {
  private repo = new BookRepository(
    new Database("../Library-Management/data/books.json")
  );

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

  const result = (await handleDatabaseOperation<IBookBase>("INSERT", {
    tableName: "books",
    data: [createdBook],
  })) as ResultSetHeader;

  const insertedBookId = result.insertId;
  console.clear();
  console.log(`Book added successfully\nBook Id:${insertedBookId}`);
  const whereParams: SimpleWhereExpression<IBook> = {
    id: { op: "EQUALS", value: insertedBookId },
  };
  const resultBook = (await handleDatabaseOperation("SELECT", {
    tableName: "books ",
    fieldsToSelect: [],
    where: whereParams,
  })) as RowDataPacket;
  console.table(resultBook);
}

async function updateBook(repo: BookRepository) {
  const id = +(await readLine("Please enter the ID of the book to update:"));
  const book = repo.getById(id)!;
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

  const handleKeyPress = (
    chunk: Buffer,
    key: { name: string; sequence: string }
  ) => {
    if (key.name === "q") {
      rl.close();
      return; // Exit the function to return to the books menu
    }
    if (
      key.name === "right" &&
      repo.list({ limit, offset }).pagination.hasNext
    ) {
      offset += limit;
    } else if (
      key.name === "left" &&
      repo.list({ limit, offset }).pagination.hasPrevious
    ) {
      offset -= limit;
    } else if (key.name === "q") {
      rl.close();
      return; // Exit the function to return to the books menu
    }
    showPage();
  };

  const showPage = () => {
    const response = repo.list({ limit, offset });
    console.clear();
    console.table(response.items);
    //TODO: progress bar
    // console.log(
    //   "[" +
    //     "=".repeat(offset + limit - 2) +
    //     "=>" +
    //     " ".repeat(40 - offset + limit) +
    //     "]"
    // );
    console.log(
      "Press '←' for next page, '→' for previous page, or 'q' to quit."
    );
  };

  process.stdin.on("keypress", handleKeyPress);
  showPage();

  await new Promise<void>((resolve) => {
    rl.on("close", resolve);
  });

  process.stdin.removeListener("keypress", handleKeyPress);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.resume();
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

  const handleKeyPress = async (
    chunk: Buffer,
    key: { name: string; sequence: string }
  ) => {
    if (key.sequence === "0") {
      rl.close();
      return; // Exit the search
    } else if (key.sequence === "\b" || key.sequence === "\u007F") {
      // Handle backspace
      searchQuery = searchQuery.slice(0, -1);
      offset = 0; // Reset offset on query change
    } else if (/^[a-zA-Z0-9 ]$/.test(key.sequence)) {
      searchQuery += key.sequence;
      offset = 0; // Reset offset on query change
    } else if (key.name === "right" && offset + limit < totalBooks) {
      offset += limit;
    } else if (key.name === "left" && offset > 0) {
      offset -= limit;
    }

    if (searchQuery.length > 0) {
      const books = await repo.searchByKeyword(searchQuery);
      totalBooks = books.length;
      const paginatedBooks = books.slice(offset, offset + limit);
      console.clear();
      console.log(`Search results for "${searchQuery}":`);
      const progress = Math.min(40, Math.floor((offset / totalBooks) * 40));
      const remaining = 40 - progress;
      console.log(
        `[${"=".repeat(progress)}${">".repeat(
          offset + limit < totalBooks ? 1 : 0
        )}${" ".repeat(remaining / 2 - 2)}]`
      );
      console.log(
        "Press '←' for previous page, '→' for next page, or '0' to quit."
      );
      console.table(paginatedBooks);

      // Display progress bar
    } else {
      console.clear();
      console.log(`Start typing to search...`);
    }
  };

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on("keypress", handleKeyPress);

  console.clear();
  console.log(`Start typing to search... (Press '0' to exit)`);

  await new Promise<void>((resolve) => {
    rl.on("close", resolve);
  });

  process.stdin.removeListener("keypress", handleKeyPress);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.resume();
}
