import { IPageRequest, IPagedResponse } from "../../core/pagination";
import { IRepository } from "../../core/repository";
import { IUser, IUserBase } from "./models/user.model";
import { Database } from "../../db/db";

// let users: IUser[] = [];
export class UserRepository implements IRepository<IUserBase, IUser> {
  constructor(private readonly db: Database) {}
  private get users(): IUser[] {
    return this.db.table<IUser>("users");
  }
  async create(data: IUserBase): Promise<IUser> {
    const user: IUser = {
      ...data,
      UId: this.users.length + 1,
    };
    this.users.push(user);
    await this.db.save();
    return user;
  }

  update(id: number, data: IUserBase): IUser | null {
    throw new Error("Method not implemented.");
  }
  delete(id: number): IUser | null {
    const userToDelete = this.getById(id);
    const index = this.users.findIndex((user) => user.UId === id);
    this.users.splice(index, 1);
    this.db.save();
    //  this.users = this.users.filter((user) => user !== userToDelete);
    return userToDelete;
  }
  getById(id: number): IUser | null {
    const user = this.users.find((b) => b.UId === id);
    return user || null;
  }

  // list(params: IPageRequest): IPagedResponse<IUser> {
  lists() {
    console.table(this.users);
    // throw new Error("Method not implemented.");
  }

  list(params: IPageRequest): IPagedResponse<IUser> {
    console.table(this.users);
    throw new Error("Method not implemented.");
  }
}
