import { IPageRequest, IPagedResponse } from "../../core/pagination";
import { IRepository } from "../../core/repository";
import { IBookBase, IBook } from "../book-management/models/books.model";

const books: IBook[] = [];
export class BookRepository implements IRepository<IBookBase, IBook> {
  create(data: IBookBase): IBook {
    const book: IBook = {
      // TODO:Impl. Validation
      ...data,
      id: books.length + 1,
      availableNumberOfCopies: data.totalNumberOfCopies,
    };
    books.push(book);
    return book;
  }
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
  delete(id: number): IBook | null {
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) {
      return null;
    }
    const deletedBook = books.splice(index, 1)[0];
    return deletedBook;
  }
  getById(id: number): IBook | null {
    const book = books.find((b) => b.id === id);
    return book || null;
  }
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
