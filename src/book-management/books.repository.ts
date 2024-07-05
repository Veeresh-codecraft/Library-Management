import { IPageRequest, IPagedResponse } from "../../core/pagination";
import { IRepository } from "../../core/repository";
import { IBookBase, IBook } from "../book-management/models/books.model";

const books: IBook[] = [];

/**
 * Class representing a repository for managing books.
 * Implements the IRepository interface for book-related operations.
 */
export class BookRepository implements IRepository<IBookBase, IBook> {
  /**
   * Creates a new book and adds it to the repository.
   * @param {IBookBase} data - The base data for the book to be created.
   * @returns {IBook} The created book with assigned ID and available number of copies.
   */
  create(data: IBookBase): IBook {
    const book: IBook = {
      // TODO: Implement validation
      ...data,
      id: books.length + 1,
      availableNumberOfCopies: data.totalNumberOfCopies,
    };
    books.push(book);
    return book;
  }

  /**
   * Updates an existing book in the repository.
   * @param {number} id - The ID of the book to update.
   * @param {IBook} data - The new data for the book.
   * @returns {IBook | null} The updated book or null if the book was not found.
   */
  update(id: number, data: IBook): IBook | null {
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) {
      return null;
    }
    const updatedBook: IBook = {
      ...books[index],
      ...data,
    };
    books[index] = updatedBook;
    return updatedBook;
  }

  /**
   * Deletes a book from the repository.
   * @param {number} id - The ID of the book to delete.
   * @returns {IBook | null} The deleted book or null if the book was not found.
   */
  delete(id: number): IBook | null {
    const index = books.findIndex((b) => b.id === id);
    console.log(index)
    if (index === -1) {
      return null;
    }
    const deletedBook = books.splice(index, 1)[0];
    return deletedBook;
  }

  /**
   * Retrieves a book by its ID.
   * @param {number} id - The ID of the book to retrieve.
   * @returns {IBook | null} The book with the specified ID or null if not found.
   */
  getById(id: number): IBook | null {
    const book = books.find((b) => b.id === id);
    return book || null;
  }

  /**
   * Lists books with pagination and optional search filtering.
   * @param {IPageRequest} params - The pagination and search parameters.
   * @returns {IPagedResponse<IBook>} The paginated response containing books and pagination info.
   */
  list(params: IPageRequest): IPagedResponse<IBook> {
    const search = params.search?.toLocaleLowerCase();
    const filteredBooks = search
      ? books.filter(
          (b) =>
            b.title.toLocaleLowerCase().includes(search) ||
            b.isbnNo.toLocaleLowerCase().includes(search)
        )
      : books;
    return {
      items: filteredBooks.slice(params.offset, params.limit + params.offset),
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total: filteredBooks.length,
      },
    };
  }
}
