import { readChar, readLine } from "../core/input.utils";
import { IInteractor } from "../core/interactor";
import { IBookBase } from "../models/books.model";
import { BookRepository } from "./models/books.repository";
const menu = `
    1. Add Book
    2. dit Book
    3.Search book
    4.<Pervious Menu>`;
export class BookInteractor implements IInteractor {
  private repo = new BookRepository();
  async showMenu(): Promise<void> {
    const op = await readChar(menu);
    switch (op.toLowerCase()) {
      case "1":
        // TODO add book flow
        break;
      case "2":
        // TODO add book flow
        break;
      case "3":
        // TODO add book flow
        break;
      case "4":
        // TODO add book flow
        break;
    }
  }
}

async function getBookInput(): Promise<IBookBase> {
  const title = await readLine("Please enter the title:");
  const author = await readLine("Please enter the author:");
  const publisher = await readLine("Please enter the publisher:");
  const genre = await readLine("Please enter the genre:");
  const isbnNo = await readLine("Please enter the isbNum:");
  const numofPages = await readLine("Please enter the number of pages:");
  const totalNumberOfCopies = await readLine(
    "Please enter the Total number of copies:"
  );

  return {
    title: title,
    author: author,
    publisher: publisher,
    genre: genre.split(" "),
    isbnNo: isbnNo,
    numofPages: +numofPages,
    totalNumberOfCopies: +totalNumberOfCopies,
  };
}

async function addBook(repo: BookRepository) {
  const book: IBookBase = await getBookInput();
  const createBook = repo.create(book);
  console.table();
}
