import { IPageRequest, IPagedResponse } from "../../core/pagination";
import { IRepository } from "../../core/repository";
// import { IBook, IBookBase } from "../../models/books.model";
import { IUser, IUserBase } from "./models/user.model";

let users: IUser[] = [];
export class UserRepository implements IRepository<IUserBase, IUser> {
  create(data: IUserBase): IUser {
    const user: IUser = {
      ...data,
      UId: users.length + 1,
    };
    users.push(user);
    return user;
  }

  update(id: number, data: IUserBase): IUser | null {
    throw new Error("Method not implemented.");
  }
  delete(id: number): IUser | null {
    const userToDelete = this.getById(id);
    users = users.filter((user) => user !== userToDelete);
    return userToDelete;
  }
  getById(id: number): IUser | null {
    const user = users.find((b) => b.UId === id);
    return user || null;
  }

  // list(params: IPageRequest): IPagedResponse<IUser> {
  lists() {
    console.table(users);
    // throw new Error("Method not implemented.");
  }

  list(params: IPageRequest): IPagedResponse<IUser> {
    console.table(users);
    throw new Error("Method not implemented.");
  }

  //   update(id: number, data: IBook): IBook | null {
  //     throw new Error("Method not implemented.");
  //   }
  //   delete(id: number): IBook | null {
  //     throw new Error("Method not implemented.");
  //   }
  //   getById(id: number): IBook | null {
  //     const book = books.find((b) => b.id === id);
  //     return book || null;
  //   }
  //   list(params: IPageRequest): IPagedResponse<IBook> {
  //     const search = params.search?.toLocaleLowerCase();
  //     const filteredBooks = search
  //       ? books.filter(
  //           (b) =>
  //             b.title.toLocaleLowerCase().includes(search) ||
  //             b.isbnNo.toLocaleLowerCase().includes(search)
  //         )
  //       : books;
  //   }
}
