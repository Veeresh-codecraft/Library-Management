import { readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
import { IBookBase } from "./models/books.model";
import { BookRepository } from "./books.repository";
import { Menu } from "../../core/menu";
import { warningTheme } from "../../core/themes";
    const menu = new Menu(" Book Management ",[
    {key:"1",label:" Add Book"},
    {key:"2",label:" Edit Book"},
    {key:"3",label:"Search book"},
    {key:"4",label:"<Pervious Menu>"},]);
export class BookInteractor implements IInteractor {
    private repo = new BookRepository();
  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await menu.show();
      if (op) {
        switch (op?.key.toLowerCase()) {
          case "1":
            // TODO add zod validation
            await addBook(this.repo);
            break;
          case "2":
            // TODO add zod validation and update logic 
            break;
          case "3":
            // TODO add  zod validation
            console.table(this.repo.list({ limit: 1000, offset: 0 }).items);
            break;
          case "4":
            loop = false;
            // TODO add book flow
            break;
        }
      }
      else {
          console.log("\n Invalid input \n\n");
        }
      }
    
  }
}


async function getBookInput():Promise<IBookBase> {
  const title = await readLine("Please enter title:");
  const author = await readLine("Please enter author:");
  const publisher = await readLine("Please enter publisher:");
  const genre = await readLine("Please enter genre:");
  const isbnNo = await readLine("Please enter isbnNo:");
  const numofPages = +await readLine("Please enter number of pages:");
  const totalNumberOfCopies = +await readLine("Please enter total num of Copies:");
  return {
title:title,
author:author,
publisher:publisher,
genre:[genre],
isbnNo:isbnNo,
numofPages:numofPages,
totalNumberOfCopies:totalNumberOfCopies,
}
} 

async function addBook(repo:BookRepository) {
  const book: IBookBase = await getBookInput();
  const createBook = repo.create(book);
  console.log(warningTheme("\n\tbook added succesfully !:\n"))
  console.table(createBook);
}