import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import { errorTheme } from "../Library-Management/core/themes";
import { IInteractor } from "./core/interactor";
import { Menu } from "./core/menu";
import { AppEnvs } from "./read-env";
import { BookInteractor } from "./src/book-management/books.interactor";
import { DrizzleManager } from "./src/drizzleDbConnection";
const menu = new Menu(`\nMain Menu `, [
  { key: "1", label: "Book Management" },
  { key: "2", label: "Member Management" },
  { key: "3", label: "Transaction" },
  { key: "4", label: "Today's due list" },
  { key: "5", label: "Exit" },
]);

export class LibraryInteractor implements IInteractor {
  private readonly drizzleManager: DrizzleManager;
  private bookInteractor: BookInteractor | null = null; // Initialize as null

  constructor() {
    this.drizzleManager = new DrizzleManager();
    // this.drizzleManager.migrate();
  }

  async showMenu(): Promise<void> {
    try {
      const db = await this.drizzleManager.getPoolDrizzle();

      let loop = true;
      while (loop) {
        const op = await menu.show();
        if (op) {
          switch (op.key.toLowerCase()) {
            case "1":
              if (!this.bookInteractor) {
                this.bookInteractor = new BookInteractor(db); // Instantiate BookInteractor with db
              }
              await this.bookInteractor.showMenu();
              break;
            case "2":
              // Handle member management
              break;
            case "5":
              loop = false;
              process.exit(0);
              break;
            default:
              console.log(errorTheme("Invalid input !!!\n\n"));
          }
        } else {
          console.log(errorTheme("\nInvalid Input!!! \n\n"));
        }
      }
      process.exit(0);
    } catch (error) {
      console.error("Error in showMenu:", error);
      process.exit(1);
    }
  }
}
