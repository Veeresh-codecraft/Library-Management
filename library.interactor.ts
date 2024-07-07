import { errorTheme } from "../library-management/core/themes";
import { IInteractor } from "./core/interactor";
import { Menu } from "./core/menu";
import { BookInteractor } from "./src/book-management/books.interactor";
import { TransactionInteractor } from "./src/transaction/transaction.interactor";
import { UserInteractor } from "./src/user-management/user.interactor";

const menu = new Menu(`\nMain Menu `, [
  { key: "1", label: "Book Management" },
  { key: "2", label: "Member Management" },
  { key: "3", label: "Transaction" },
  { key: "4", label: "Today's due list" },
  { key: "5", label: "Exit" },
]);

export class LibraryInteractor implements IInteractor {
  private readonly bookInteractor = new BookInteractor();
  private readonly userInteractor = new UserInteractor();
  private readonly transactionInteractor = new TransactionInteractor();
  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await menu.show();
      if (op) {
        switch (op?.key.toLocaleLowerCase()) {
          case "1":
            await this.bookInteractor.showMenu();
            break;
          case "2":
            await this.userInteractor.showMenu();
          case "3":
            await this.transactionInteractor.showMenu();
          case "5":
            loop = false;
            process.exit(0);
          default:
            console.log(errorTheme("Invalid input !!!\n\n"));
        }
      } else {
        console.log(errorTheme("\nInvalid Input!!! \n\n"));
      }
    }
    process.exit(0);
  }
}
