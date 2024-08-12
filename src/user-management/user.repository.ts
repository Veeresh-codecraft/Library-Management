import bcrypt from "bcrypt";
import { IRepository } from "../../core/repository";
import { MySql2Database } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { usersTable } from "../drizzle/schema";
import { IUserBase, IUser } from "../user-management/models/user.model";

export class UserRepository implements IRepository<IUserBase, IUser> {
  constructor(private readonly db: MySql2Database<Record<string, unknown>>) {}

  /**
   * Creates a new user and adds them to the repository.
   * @param {IUserBase} data - The base data for the user to be created.
   * @returns {Promise<IUser>} The created user with assigned ID.
   */
  async create(data: IUserBase): Promise<IUser> {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.passwordHash, saltRounds);

    // Prepare user data with hashed password
    const user = {
      username: data.username,
      email: data.email,
      passwordHash, // Use the hashed password
      role: data.role,
    };

    try {
      console.log(user);
      const [result] = await this.db
        .insert(usersTable)
        .values(user)
        .$returningId();

      const insertedUserId = result.userId;
      if (insertedUserId) {
        const [insertedUser] = await this.db
          .select()
          .from(usersTable)
          .where(eq(usersTable.userId, insertedUserId));
        return insertedUser as IUser;
      } else {
        console.error("Inserted But ID not matching");
        return user as IUser;
      }
    } catch (err) {
      console.error("Error creating user:", err);
      throw err;
    }
  }

  /**
   * Updates an existing user in the repository.
   * @param {number} id - The ID of the user to update.
   * @param {IUser} data - The new data for the user.
   * @returns {Promise<IUser | null>} The updated user or null if the user was not found.
   */
  async update(id: number, data: IUser): Promise<IUser | null> {
    try {
      const result = await this.db
        .update(usersTable)
        .set(data)
        .where(sql`${usersTable.userId} = ${id}`)
        .execute();

      if (result) {
        const [updatedUser] = await this.db
          .select()
          .from(usersTable)
          .where(sql`${usersTable.userId} = ${id}`)
          .execute();

        return updatedUser as IUser;
      } else {
        console.log("Unable to update the user");
        return null;
      }
    } catch (err) {
      console.error("Error updating user:", err);
      return null;
    }
  }

  /**
   * Deletes a user from the repository.
   * @param {number} id - The ID of the user to delete.
   * @returns {Promise<IUser | null>} The deleted user or null if the user was not found.
   */
  async delete(id: number): Promise<IUser | null> {
    try {
      const [deletingUser] = await this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.userId, id));
      if (deletingUser) {
        const [result] = await this.db
          .delete(usersTable)
          .where(eq(usersTable.userId, id));
        if (result) {
          return deletingUser as IUser;
        } else {
          console.error("Deleting unsuccessful");
          return null;
        }
      } else {
        console.error("User does not exist");
        return null;
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      throw new Error("Deletion failed");
      return null;
    }
  }

  /**
   * Retrieves a user by their ID.
   * @param {number} id - The ID of the user to retrieve.
   * @returns {Promise<IUser | null>} The user with the specified ID or null if not found.
   */
  async getById(id: number): Promise<IUser | null> {
    try {
      const [user] = await this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.userId, id));
      return user as IUser;
    } catch (err) {
      console.error("Error fetching user:", err);
      throw err;
    }
  }

  /**
   * Lists users with optional search, pagination, and filters.
   * @param {object} params - The parameters for listing users.
   * @param {number} [params.limit=10] - The maximum number of users to return.
   * @param {number} [params.offset=0] - The number of users to skip.
   * @param {string} [params.search] - Optional search keyword for filtering users by username or email.
   * @returns {Promise<{items: IUser[], pagination: {offset: number, limit: number, total: number, hasNext: boolean, hasPrevious: boolean}}>}
   */
  async list(params: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any> {
    const { limit = 10, offset = 0, search } = params;

    try {
      let query = this.db.select().from(usersTable) as any;

      if (search) {
        query = query.where(
          sql`${usersTable.username} LIKE ${`%${search}%`} OR ${
            usersTable.email
          } LIKE ${`%${search}%`}`
        );
      }

      query = query.limit(limit).offset(offset);

      const users = await query.execute();

      return {
        items: users as IUser[],
        pagination: {
          offset: offset || 0,
          limit: limit || users.length,
          total: users.length,
          hasNext: limit !== undefined && users.length === limit,
          hasPrevious: (offset || 0) > 0,
        },
      };
    } catch (err) {
      console.error("Error listing users:", err);
      throw err;
    }
  }
}
