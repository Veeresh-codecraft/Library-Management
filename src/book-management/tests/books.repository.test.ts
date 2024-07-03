import { describe, test, expect, beforeEach } from "vitest";
import { faker } from "@faker-js/faker";
import { BookRepository } from "../books.repository";
import { IBookBase, IBook } from "../models/books.model";

describe("BookRepository", () => {
  let repo: BookRepository;

  beforeEach(() => {
    repo = new BookRepository();
    // Clear the books array before each test
    (repo as any).books = [];
  });

  const generateBookData = (): IBookBase => ({
    title: faker.lorem.words(),
    author: faker.name.fullName(),
    publisher: faker.company.name(),
    genre: [faker.lorem.word()],
    isbnNo: faker.datatype.string(10),
    numofPages: faker.datatype.number({ min: 100, max: 1000 }),
    totalNumberOfCopies: faker.datatype.number({ min: 1, max: 100 }),
  });

  const createMultipleBooks = (count: number): IBook[] => {
    const books: IBook[] = [];
    for (let i = 0; i < count; i++) {
      const bookData = generateBookData();
      const createdBook = repo.create(bookData);
      books.push(createdBook);
    }
    return books;
  };

  test("should create 100 books", () => {
    const books = createMultipleBooks(100);

    expect(books.length).toBe(100);
    books.forEach((book, index) => {
      expect(book).toMatchObject({
        id: index + 1,
        ...book,
        availableNumberOfCopies: book.totalNumberOfCopies,
      });
    });
  });

  test("should update a book", () => {
    const books = createMultipleBooks(100);
    const randomIndex = faker.datatype.number({ min: 0, max: 99 });
    const updatedBookData: Partial<IBook> = { ...books[randomIndex] };
    
    // Modify specific properties to update
    updatedBookData.title = faker.lorem.words();

    const updatedBook = repo.update(books[randomIndex].id, updatedBookData as IBook);

    expect(updatedBook).toMatchObject(updatedBookData);
  });

  test("should return null if trying to update a non-existent book", () => {
    const bookData = generateBookData();
    const updatedBookData: IBook = {
      id: 109, // assuming 109 is not an existing book id
      ...bookData,
      availableNumberOfCopies: bookData.totalNumberOfCopies,
    };

    const result = repo.update(1111, updatedBookData);

    expect(result).toBeNull();
  });

  test("should delete a book", () => {
    const books = createMultipleBooks(100);
    const randomIndex = faker.datatype.number({ min: 0, max: 99 });
    const deletedBook = repo.delete(books[randomIndex].id);

    expect(deletedBook).toMatchObject(books[randomIndex]);
    expect(repo.getById(books[randomIndex].id)).toBeNull();
  });

  test("should return null if trying to delete a non-existent book", () => {
    const result = repo.delete(2222); // assuming 101 is not an existing book id

    expect(result).toBeNull();
  });

  test("should get a book by id", () => {
    const books = createMultipleBooks(100);
    const randomIndex = faker.datatype.number({ min: 0, max: 99 });
    const fetchedBook = repo.getById(books[randomIndex].id);

    expect(fetchedBook).toMatchObject(books[randomIndex]);
  });

  test("should return null if trying to get a non-existent book by id", () => {
    const result = repo.getById(701); // assuming 101 is not an existing book id

    expect(result).toBeNull();
  });

  test("should filter books by search term", () => {
    const bookData1 = generateBookData();
    const bookData2 = { ...generateBookData(), title: "Another Test Book" };

    repo.create(bookData1);
    repo.create(bookData2);

    const result = repo.list({ limit: 10, offset: 0, search: "Another" });

    expect(result.items.length).toBe(1);
    expect(result.items[0].title).toBe("Another Test Book");
  });
});
