import { readChar, readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
import { IBookBase, IBook } from "./models/books.model";
import { BookRepository } from "./books.repository";
import { Menu } from "../../core/menu";

const menu = new Menu("Book Management", [
  { key: "1", label: "Add Book" },
  { key: "2", label: "Edit Book" },
  { key: "3", label: "Search Book" },
  { key: "4", label: "<Previous Menu>" },
]);

export class BookInteractor implements IInteractor {
  private repo = new BookRepository();

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
            console.table(this.repo.list({ limit: 1000, offset: 0 }).items);
            break;
          case "4":
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
  const title = await readLine("Please enter title:");
  const author = await readLine("Please enter author:");
  const publisher = await readLine("Please enter publisher:");
  const genre = await readLine("Please enter genre:");
  const isbnNo = await readLine("Please enter isbnNo:");
  const numofPages = +(await readLine("Please enter number of pages:"));
  const totalNumberOfCopies = +(await readLine(
    "Please enter total num of Copies:"
  ));

  return {
    title: title,
    author: author,
    publisher: publisher,
    genre: [genre],
    isbnNo: isbnNo,
    numofPages: numofPages,
    totalNumberOfCopies: totalNumberOfCopies,
  };
}

async function addBook(repo: BookRepository) {
  const book: IBookBase = await getBookInput();
  const createBook = repo.create(book);
  console.log("Book added successfully\nBook Id:");
  console.table(createBook);
}

async function updateBook(repo: BookRepository) {
  const id = +(await readLine("Please enter the ID of the book to update:"));
  const existingBook = repo.getById(id);

  if (!existingBook) {
    console.log(`Book with ID ${id} not found.`);
    return;
  }

  const updatedBookInput: IBookBase = await getBookInput();
  const updatedBook: IBook = {
    ...existingBook,
    ...updatedBookInput,
  };

  const result = repo.update(id, updatedBook);
  if (result) {
    console.log("Book updated successfully\nUpdated Book:");
    console.table(result);
  } else {
    console.log(`Failed to update book with ID ${id}.`);
  }
}
