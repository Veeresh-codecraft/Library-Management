import { IPageRequest, IPagedResponse } from "../../core/pagination.model";
import { IRepository } from "../../core/repository";
import { IBookBase, IBook } from "../book-management/models/books.model";
import { Database } from "../../db/db";
import { handleDatabaseOperation } from "../diLayer";
import { SimpleWhereExpression } from "../../libs/types";
import { error } from "console";
import { ResultSetHeader, RowDataPacket } from "mysql2";
export class BookRepository implements IRepository<IBookBase, IBook> {
  private readonly books: IBook[];

  constructor(private readonly db: Database<{ books: IBook[] }>) {
    this.books = this.db.table("books");
  }

  /**
   * Creates a new book and adds it to the repository.
   * @param {IBookBase} data - The base data for the book to be created.
   * @returns {Promise<IBook>} The created book with assigned ID and available number of copies.
   */
  async create(data: IBookBase): Promise<IBook> {
    const book: IBook = {
      // TODO: Implement validation
      ...data,
      id: 0,
      availableNumberOfCopies: data.totalNumberOfCopies,
    };

    return book;
  }

  /**
   * Updates an existing book in the repository.
   * @param {number} id - The ID of the book to update.
   * @param {IBook} data - The new data for the book.
   * @returns {Promise<IBook | null>} The updated book or null if the book was not found.
   */
  async update(id: number, data: IBook): Promise<IBook | null> {
    const whereParams: SimpleWhereExpression<IBook> = {
      id: { op: "EQUALS", value: id },
    };

    const result = (await handleDatabaseOperation<IBook>("UPDATE", {
      tableName: "books",
      data: [data],
      where: whereParams,
    })) as ResultSetHeader;
    const updatedBook = (await handleDatabaseOperation<IBook>("SELECT", {
      tableName: "books ",
      fieldsToSelect: [],
      where: whereParams,
    })) as IBook;
    if (result.affectedRows <= 0) {
      throw new Error("Update is unsuccessful");
    }
    //const index = this.books.findIndex((b) => b.id === id);
    // if (index === -1) {
    //   return null;
    // }
    // const updatedBook: IBook = {
    //   ...this.books[index],
    //   ...data,
    // };
    //this.books[index] = updatedBook;
    //await this.db.save();
    return updatedBook;
  }

  /**
   * Deletes a book from the repository.
   * @param {number} id - The ID of the book to delete.
   * @returns {Promise<IBook | null>} The deleted book or null if the book was not found.
   */
  async delete(id: number): Promise<IBook | null> {
    //const index = this.books.findIndex((b) => b.id === id);
    const whereParams: SimpleWhereExpression<IBook> = {
      id: { op: "EQUALS", value: id },
    };

    const deletedBook = (await handleDatabaseOperation<IBook>("SELECT", {
      tableName: "books ",
      fieldsToSelect: [],
      where: whereParams,
    })) as IBook;
    try {
      const result = (await handleDatabaseOperation("DELETE", {
        tableName: "books",
        where: whereParams,
      })) as ResultSetHeader;
      if (result.affectedRows === 1) {
        console.log("Deleted Successfully");
      }
    } catch (err) {
      throw new Error("deletion failed");
    }
    //const deletedBook = this.books.splice(index, 1)[0];
    return deletedBook;
  }

  /**
   * Retrieves a book by its ID.
   * @param {number} id - The ID of the book to retrieve.
   * @returns {IBook | null} The book with the specified ID or null if not found.
   */
  async getById(id: number): Promise<IBook | null> {
    const whereParams: SimpleWhereExpression<IBook> = {
      id: { op: "EQUALS", value: id },
    };
    const book = (await handleDatabaseOperation<IBook>("SELECT", {
      tableName: "books ",
      fieldsToSelect: [],
      where: whereParams,
    })) as RowDataPacket;
    if (book) {
      return book[0] as IBook;
    } else {
      return null;
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
