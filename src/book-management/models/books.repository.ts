import { IPageRequest, IPagedResponse } from "../../core/pagination";
import { IRepository } from "../../core/repository";
import { IBook,IBookBase } from "../../models/books.model";

const books: IBook[]=[];
export class BookRepository implements IRepository<IBookBase,IBook>{
    create(data: IBookBase): IBook {
        const book: IBook = {
            // TODO:Impl. Validation
            ...data,
            id: books.length + 1,
            availableNumberOfCopies:data.totalNumberOfCopies
        }
        books.push(book);
        return book;
    }
    update(id: number, data: IBook): IBook | null {
        throw new Error("Method not implemented.");
    }
    delete(id: number): IBook | null {
        throw new Error("Method not implemented.");
    }
    getById(id: number): IBook | null {
        const book = books.find(b => b.id === id);
        return book || null;
    }
    list(params: IPageRequest): IPagedResponse<IBook> {
        const search = params.search?.toLocaleLowerCase();
        const filteredBooks = search ? books.filter(
            b => b.title.toLocaleLowerCase().includes(search) || b.isbnNo.toLocaleLowerCase().includes(search)) : books;
    }
    
}