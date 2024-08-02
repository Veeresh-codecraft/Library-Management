import { IPageRequest, IPagedResponse } from "../../core/pagination.model";
import { IRepository } from "../../core/repository";
import { IBookBase, IBook } from "../book-management/models/books.model";
import { Database, Row } from "../../db/db";
import { handleDatabaseOperation } from "../diLayer";
import { SimpleWhereExpression } from "../../libs/types";
import { error } from "console";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2";
import { booksTable } from "../drizzle/schema";
import { AppEnvs } from "../../read-env";
import { and, eq, ilike, like, sql } from "drizzle-orm";
import { DBConfig, MySqlFactory } from "../../db/mysqlconnection";
import { MySql2Database } from "drizzle-orm/mysql2";
import { generateSelectSql } from "../../libs/mysql-query-generator";
const config: DBConfig = {
  dbURL: AppEnvs.DATABASE_URL,
};
export class BookRepository implements IRepository<IBookBase, IBook> {
  constructor(private readonly db: MySql2Database<Record<string, unknown>>) {}

  /**
   * Creates a new book and adds it to the repository.
   * @param {IBookBase} data - The base data for the book to be created.
   * @returns {Promise<IBook>} The created book with assigned ID and available number of copies.
   */
  async create(data: IBookBase): Promise<IBook> {
    const book = {
      // TODO: Implement validation
      ...data,
      id: 0,
      availableNumberOfCopies: data.totalNumberOfCopies,
    };
    try {
      const [result] = await this.db
        .insert(booksTable)
        .values(book)
        .$returningId();
      // const insertedBookId = result.insertId;

      const insertedBookId = result.id;
      if (insertedBookId) {
        const [insertedBook] = await this.db
          .select()
          .from(booksTable)
          .where(eq(booksTable.id, insertedBookId));
        return insertedBook as IBook;
      } else {
        console.error("Inserted But ID not matching");
        return book;
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * Updates an existing book in the repository.
   * @param {number} id - The ID of the book to update.
   * @param {IBook} data - The new data for the book.
   * @returns {Promise<IBook | null>} The updated book or null if the book was not found.
   */
  async update(id: number, data: IBook): Promise<IBook | null> {
    try {
      // Perform the update operation
      const result = await (
        await this.db
      )
        .update(booksTable)
        .set(data)
        .where(sql`${booksTable.id} = ${id}`)
        .execute();

      if (result) {
        const [updatedBook] = await (
          await this.db
        )
          .select()
          .from(booksTable)
          .where(sql`${booksTable.id} = ${id}`)
          .execute();

        return updatedBook as IBook;
      } else {
        console.log("Unable to update the book");
        return null;
      }
    } catch (err) {
      console.error("Error updating book:", err);
      return null;
    }
  }

  /**
   * Deletes a book from the repository.
   * @param {number} id - The ID of the book to delete.
   * @returns {Promise<IBook | null>} The deleted book or null if the book was not found.
   */
  async delete(id: number): Promise<IBook | null> {
    try {
      const [deletingBook] = await (await this.db)
        .select()
        .from(booksTable)
        .where(eq(booksTable.id, id));
      if (deletingBook) {
        const [result] = await (await this.db)
          .delete(booksTable)
          .where(eq(booksTable.id, id));
        if (result) {
          return deletingBook as IBook;
        } else {
          console.error("deleting unsuccessful");
          return null;
        }
      } else {
        console.error("book does not exist");
        return null;
      }
    } catch (err) {
      throw new Error("deletion failed");
      return null;
    }
  }

  /**
   * Retrieves a book by its ID.
   * @param {number} id - The ID of the book to retrieve.
   * @returns {IBook | null} The book with the specified ID or null if not found.
   */
  async getById(id: number): Promise<IBook | null> {
    try {
      const [insertedBook] = await (await this.db)
        .select()
        .from(booksTable)
        .where(eq(booksTable.id, id));
      return insertedBook as IBook;
    } catch (err) {
      throw err;
    }
  }

  async list(params: {
    limit?: number; // Optional
    offset?: number; // Optional
    search?: string; // Optional
  }): Promise<any> {
    const { limit, offset, search } = params;

    try {
      // Build the query using Drizzle ORM
      let query = (await this.db).select().from(booksTable) as any; // Type assertion to bypass TypeScript error

      if (search) {
        query = query.where(
          and(
            like(booksTable.title, `%${search}%`),
            like(booksTable.isbnNo, `%${search}%`)
          )
        ) as any; // Type assertion to bypass TypeScript error
      }

      // Apply limit and offset only if they are provided
      if (limit !== undefined && offset !== undefined) {
        query = query.limit(limit).offset(offset) as any; // Type assertion to bypass TypeScript error
      }

      const books = await query.execute();

      return {
        items: books as IBook[],
        pagination: {
          offset: offset || 0, // Default to 0 if not provided
          limit: limit || books.length, // Default to total number of books if not provided
          total: books.length,
          hasNext: limit !== undefined && books.length === limit, // If length matches the limit, there might be more items
          hasPrevious: (offset || 0) > 0,
        },
      };
    } catch (err) {
      console.error("Error listing books:", err);
      throw err;
    }
  }

  async searchByKeyword(keyword: string): Promise<IBook[]> {
    try {
      const results = await (
        await this.db
      )
        .select()
        .from(booksTable)
        .where(like(booksTable.title, `%${keyword}%`)) // Use 'like' for case-insensitive search
        .limit(100)
        .execute();

      return results as IBook[];
    } catch (err) {
      console.error("Error searching books:", err);
      throw err;
    }
  }
}
