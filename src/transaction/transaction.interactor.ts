import * as readline from "readline";
import * as process from "process";
import { readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
import { Menu } from "../../core/menu";
import { Database } from "../../db/db";
import { BookRepository } from "../book-management/books.repository";
import { UserRepository } from "../user-management/user.repository";
import { ITransaction, ITransactionBase } from "./model/transaction.model";
import { TransactionRepository } from "./transaction.repository";
import date from "date-and-time";
import { IBook } from "../book-management/models/books.model";
import { IUser } from "../user-management/models/user.model";

const menu = new Menu("Transaction Management", [
  { key: "1", label: "Issue New Book" },
  { key: "2", label: "Record Recieved Book" },
  { key: "3", label: "Search by UserID" },
  { key: "4", label: "Search by BookId" },
  { key: "5", label: "Due List" },
  { key: "6", label: "<Previous Menu>" },
  //   TODO implement edit transaction
]);

export class TransactionInteractor implements IInteractor {
  private repo = new TransactionRepository(
    new Database("../Library-Management/data/databse.json")
  );

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await menu.show();
      if (op) {
        switch (op?.key.toLowerCase()) {
          case "1":
            await issueBook(this.repo);
            break;
          case "2":
            await recordRecievedBook(this.repo);
            break;
          case "3":
            await searchTransactionByUserId(this.repo);
            break;
          case "4":
            await searchTransactionByBookTitle(this.repo);
            break;
          case "5":
            await showDueList(this.repo);
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
async function getTransactionInput(): Promise<ITransactionBase> {
  const bookId = +(await readLine(`Please enter book ID:`));
  const userId = +(await readLine(`Please enter user ID:`));
  const transactionType = (await readLine(
    `Please enter transaction type (borrow/return):`
  )) as "borrow" | "return";
  return {
    bookId: bookId,
    userId: userId,
    transactionType: transactionType,
  };
}
async function issueBook(repo: TransactionRepository) {
  const transaction: ITransactionBase = await getTransactionInput();

  // Get the book instance
  const book = await getBookInstance(transaction.bookId);
  if (!book) {
    console.log(` ${transaction.bookId} is an INVALID Book ID.`);
    return;
  }

  // Get the user instance
  const user = await getUserInstance(transaction.userId);
  if (!user) {
    console.log(` ${transaction.userId} is an INVALID User ID.`);
    return;
  }

  if (book.totalNumberOfCopies < book.availableNumberOfCopies) {
    console.log(`${book.title} book is currently out of stock`);
    return;
  }

  const responseTransaction = await repo.create(transaction);
  console.log(`${responseTransaction.transactionId} is successful`);
}

async function getBookInstance(bookId: number): Promise<IBook | null> {
  const Bookrepo = new BookRepository(
    new Database("../Library-Management/data/databse.json")
  );
  return Bookrepo.getById(bookId);
}

//TODO naga fix this function, i just need instance of database 
async function getUserInstance(userId: number): Promise<IUser | null> {
  const Userrepo = new UserRepository(
    new Database("../Library-Management/data/databse.json")
  );
  return Userrepo.getById(userId);
}

async function recordRecievedBook(repo: TransactionRepository) {
  const transaction: ITransactionBase = await getTransactionInput();
  const response = await repo.Returnupdate(transaction);
  console.log(
    `${response?.userId} for Book ${response?.bookId} has been fined  ${response?.lateFees}`
  );
}

async function showDueList(repo: TransactionRepository) {
  
}

async function searchTransactionByUserId(repo: TransactionRepository) {
  const userId = +(await readLine(`Please enter user ID:`));
  await showPaginatedTransactions(repo,userId);
}

async function searchTransactionByBookTitle(repo: TransactionRepository) {
  const bookId = +(await readLine(`Please enter book ID:`));
  await showPaginatedTransactions(repo, undefined,bookId);
}

async function showPaginatedTransactions(repo: TransactionRepository,userId?:number,bookId?:number): Promise<void> {
  let offset = 0;
  const limit = 10; // Number of items per page
  const search = userId ? `u${userId}` : `b${bookId}`;
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
      repo.list({ search, limit, offset }).pagination.hasNext
    ) {
      offset += limit;
    } else if (
      key.name === "left" &&
      repo.list({ search, limit, offset }).pagination.hasPrevious
    ) {
      offset -= limit;
    } else if (key.name === "q") {
      rl.close();
      return; // Exit the function to return to the books menu
    }
    showPage();
  };
const showPage = () => {
  const response = repo.list({ search, limit, offset });
  console.clear();

  // Format the dates and print the items
  const formattedItems = response.items.map((item) => {
    return {
      ...item,
      transactionDate: item.transactionDate
        ? date.format(item.transactionDate, "yyyy MM dd")
        : "N/A",
      dueDate: item.dueDate ? date.format(item.dueDate, "yyyy MM dd") : "N/A",
      returnDate: item.returnDate
        ? date.format(item.returnDate, "yyyy MM dd")
        : "N/A",
    };
  });

  console.table(formattedItems);

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