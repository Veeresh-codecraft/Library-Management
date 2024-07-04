import { IPageRequest, IPagedResponse } from "../../core/pagination";
import { IRepository } from "../../core/repository";
import { IUser, IUserBase } from "./models/user.model";
import { Database } from "../../db/db";

/**
 * Class representing a user repository.
 * @implements {IRepository<IUserBase, IUser>}
 */
export class UserRepository implements IRepository<IUserBase, IUser> {
  /**
   * Creates an instance of UserRepository.
   * @param {Database} db - The database instance.
   */
  constructor(private readonly db: Database) {}

  /**
   * Retrieves the list of users from the database.
   * @private
   * @returns {IUser[]} The list of users.
   */
  private get users(): IUser[] {
    return this.db.table<IUser>("users");
  }

  /**
   * Creates a new user.
   * @param {IUserBase} data - The user data.
   * @returns {Promise<IUser>} The created user.
   */
  async create(data: IUserBase): Promise<IUser> {
    const user: IUser = {
      ...data,
      UId: this.users.length + 1,
    };
    this.users.push(user);
    await this.db.save();
    return user;
  }

  /**
   * Updates an existing user.
   * @param {number} UIdToUpdate - The ID of the user to update.
   * @param {IUserBase} updatedData - The updated user data.
   * @returns {IUser | null} The updated user or null if not found.
   */
  update(UIdToUpdate: number, updatedData: IUserBase): IUser | null {
    const user: IUser = this.getById(UIdToUpdate)!;
    if (updatedData.name != "") {
      user.name = updatedData.name;
      this.db.save();
    }
    if (updatedData.DOB != "") {
      user.DOB = updatedData.DOB;
      this.db.save();
    }
    if (updatedData.phoneNum != NaN! || updatedData.phoneNum !== 0) {
      console.log(
        typeof updatedData.phoneNum,
        updatedData.phoneNum,
        user.phoneNum
      );
      user.phoneNum = updatedData.phoneNum;
      this.db.save();
    }
    return user;
  }

  /**
   * Deletes a user by ID.
   * @param {number} id - The ID of the user to delete.
   * @returns {IUser | null} The deleted user or null if not found.
   */
  delete(id: number): IUser | null {
    const userToDelete = this.getById(id);
    const index = this.users.findIndex((user) => user.UId === id);
    this.users.splice(index, 1);
    this.db.save();
    return userToDelete;
  }

  /**
   * Retrieves a user by ID.
   * @param {number} id - The ID of the user.
   * @returns {IUser | null} The user or null if not found.
   */
  getById(id: number): IUser | null {
    const user = this.users.find((b) => b.UId === id);
    return user || null;
  }

  /**
   * Lists all users.
   */
  lists() {
    console.table(this.users);
  }

  /**
   * Lists users with pagination.
   * @param {IPageRequest} params - The pagination parameters.
   * @returns {IPagedResponse<IUser>} The paginated response.
   */
  list(params: IPageRequest): IPagedResponse<IUser> {
    console.table(this.users);
    throw new Error("Method not implemented.");
  }
}
