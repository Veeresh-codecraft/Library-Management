import { IPageRequest, IPagedResponse } from "../../core/pagination.model";
import { IRepository } from "../../core/repository";
import { IBookBase, IBook } from "../book-management/models/books.model";
import { Database, Row } from "../../db/db";
import { handleDatabaseOperation } from "../diLayer";
import { SimpleWhereExpression } from "../../libs/types";
import { error } from "console";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2";

import { AppEnvs } from "../../read-env";
import {
  generateDeleteSql,
  generateInsertSql,
  generateSelectSql,
  generateUpdateSql,
  MySqlQueryGenerator,
} from "../../libs/mysql-query-generator";
import { DBConfig, MySqlFactory } from "../../db/mysqlconnection";
const config: DBConfig = {
  dbURL: AppEnvs.DATABASE_URL,
};
export class BookRepository implements IRepository<IBookBase, IBook> {
  private readonly books: IBook[];

  private factory = new MySqlFactory(config);
  constructor(private readonly db: Database<{ books: IBook[] }>) {
    this.books = this.db.table("books");
  }

  /**
   * Creates a new book and adds it to the repository.
   * @param {IBookBase} data - The base data for the book to be created.
   * @returns {Promise<IBook>} The created book with assigned ID and available number of copies.
   */
  async create(data: IBookBase): Promise<IBook> {
    const connection = await this.factory.acquirePoolConnection();
    const book: IBook = {
      // TODO: Implement validation
      ...data,
      id: 0,
      availableNumberOfCopies: data.totalNumberOfCopies,
    };
    try {
      const insertQuery = await generateInsertSql("books", [book]);
      connection.initialize();

      const result = await connection.query<ResultSetHeader>(
        insertQuery.sqlQuery,
        insertQuery.values
      );
      const insertedBookId = result.insertId;
      if (result.affectedRows === 1) {
        const whereParams: SimpleWhereExpression<IBook> = {
          id: { op: "EQUALS", value: insertedBookId },
        };
        const selectQuery = await generateSelectSql(
          "books",
          [],
          whereParams,
          0,
          10
        );
        const insertedBook = (await connection.query(
          selectQuery.sqlQuery,
          selectQuery.values
        )) as RowDataPacket;
        return insertedBook[0] as IBook;
      } else {
        return book;
      }
    } catch (err) {
      throw err;
    } finally {
      await connection.release();
    }
  }

  /**
   * Updates an existing book in the repository.
   * @param {number} id - The ID of the book to update.
   * @param {IBook} data - The new data for the book.
   * @returns {Promise<IBook | null>} The updated book or null if the book was not found.
   */
  async update(id: number, data: IBook): Promise<IBook | null> {
    const connection = await this.factory.acquirePoolConnection();
    const whereParams: SimpleWhereExpression<IBook> = {
      id: { op: "EQUALS", value: id },
    };
    try {
      const updateQuery = await generateUpdateSql("books", [data], whereParams);
      connection.initialize();
      const result = await connection.query<ResultSetHeader>(
        updateQuery.sqlQuery,
        updateQuery.values
      );
      if (result.affectedRows == 1) {
        const selectQuery = await generateSelectSql(
          "books",
          [],
          whereParams,
          0,
          10
        );
        const updatedBook = (await connection.query(
          selectQuery.sqlQuery,
          selectQuery.values
        )) as RowDataPacket;
        if (updatedBook) {
          return updatedBook[0] as IBook;
        } else {
          return null;
        }
      } else {
        console.log("Unable to update th book");
        return null;
      }
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      connection.release();
    }
  }

  /**
   * Deletes a book from the repository.
   * @param {number} id - The ID of the book to delete.
   * @returns {Promise<IBook | null>} The deleted book or null if the book was not found.
   */
  async delete(id: number): Promise<IBook | null> {
    const connection = await this.factory.acquirePoolConnection();
    const whereParams: SimpleWhereExpression<IBook> = {
      id: { op: "EQUALS", value: id },
    };
    const deleteQuery = await generateDeleteSql("books ", whereParams);
    const deletedBookQuery = await generateSelectSql(
      "books",
      [],
      whereParams,
      0,
      10
    );
    try {
      connection.initialize();
      const deletedBook = (await connection.query(
        deletedBookQuery.sqlQuery,
        deleteQuery.values
      )) as RowDataPacket;
      if (deletedBook) {
        const deleteResult = await connection.query<ResultSetHeader>(
          deleteQuery.sqlQuery,
          deleteQuery.values
        );
        if (deleteResult.affectedRows === 1) {
          return deletedBook[0] as IBook;
        } else {
          console.error("could not delete book");
        }
      }
      return null;
    } catch (err) {
      throw new Error("deletion failed");
    } finally {
      connection.release();
    }
  }

  /**
   * Retrieves a book by its ID.
   * @param {number} id - The ID of the book to retrieve.
   * @returns {IBook | null} The book with the specified ID or null if not found.
   */
  async getById(id: number): Promise<IBook | null> {
    const connection = await this.factory.acquirePoolConnection();
    const whereParams: SimpleWhereExpression<IBook> = {
      id: { op: "EQUALS", value: id },
    };
    try {
      const selectQuery = (await generateSelectSql(
        "books",
        [],
        whereParams,
        0,
        10
      )) as RowDataPacket;
      const book = (await connection.query(
        selectQuery.sqlQuery,
        selectQuery.values
      )) as RowDataPacket;
      if (book) {
        return book[0] as IBook;
      } else {
        return null;
      }
    } catch (err) {
      throw err;
    } finally {
      await connection.release();
    }
    //const book = this.books.find((b) => b.id === id);
  }

  /**
   * Lists books with pagination and optional search filtering.
   * @param {IPageRequest} params - The pagination and search parameters.
   * @returns {IPagedResponse<IBook>} The paginated response containing books and pagination info.
   */
  list(params: IPageRequest): IPagedResponse<IBook> {
    const search = params.search?.toLocaleLowerCase();
    const filteredBooks = search
      ? this.books.filter(
          (b) =>
            b.title.toLocaleLowerCase().includes(search) ||
            b.isbnNo.toLocaleLowerCase().includes(search)
        )
      : this.books;
    const totLen = filteredBooks.length;
    const items = filteredBooks.slice(
      params.offset,
      params.limit + params.offset
    );
    const hasNext = params.offset + params.limit < filteredBooks.length;
    const hasPrevious = params.offset > 0;

    return {
      items,
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total: filteredBooks.length,
        hasNext,
        hasPrevious,
      },
    };
  }
  async searchByKeyword(keyword: string): Promise<IBook[]> {
    const result = (await handleDatabaseOperation<IBook>("SELECT", {
      tableName: "books ",
      fieldsToSelect: [],
      //where: whereParams,
      offset: 0,
      limit: 1000,
    })) as IBook[];
    //const books = await this.list({ limit: 1000, offset: 0 }).items;
    return result.filter((book) =>
      book.title.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}
