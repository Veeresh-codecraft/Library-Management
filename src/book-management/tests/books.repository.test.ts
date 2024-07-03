import { describe, test, expect, beforeEach } from "vitest";
import { BookRepository } from "../books.repository";
import { IBookBase, IBook } from "../models/books.model";

describe("BookRepository", () => {
  let repo: BookRepository;

  beforeEach(() => {
    repo = new BookRepository();
    // Clear the books array before each test
    (repo as any).books = [];
  });

  test("should create a book", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Author Name",
      publisher: "Publisher Name",
      genre: ["Fiction"],
      isbnNo: "1234567890",
      numofPages: 300,
      totalNumberOfCopies: 10,
    };

    const createdBook = repo.create(bookData);

    expect(createdBook).toMatchObject({
      id: 1,
      ...bookData,
      availableNumberOfCopies: bookData.totalNumberOfCopies,
    });
  });

  test("should update a book", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Author Name",
      publisher: "Publisher Name",
      genre: ["Fiction"],
      isbnNo: "1234567890",
      numofPages: 300,
      totalNumberOfCopies: 10,
    };

    const createdBook = repo.create(bookData);
    const updatedBookData: IBook = {
      ...createdBook,
      title: "Updated Test Book",
    };

    const updatedBook = repo.update(createdBook.id, updatedBookData);

    expect(updatedBook).toMatchObject(updatedBookData);
  });

  test("should return null if trying to update a non-existent book", () => {
    const updatedBookData: IBook = {
      id: 1,
      title: "Updated Test Book",
      author: "Author Name",
      publisher: "Publisher Name",
      genre: ["Fiction"],
      isbnNo: "1234567890",
      numofPages: 300,
      totalNumberOfCopies: 10,
      availableNumberOfCopies: 10,
    };

    const result = repo.update(999, updatedBookData);

    expect(result).toBeNull();
  });

  test("should delete a book", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Author Name",
      publisher: "Publisher Name",
      genre: ["Fiction"],
      isbnNo: "1234567890",
      numofPages: 300,
      totalNumberOfCopies: 10,
    };

    const createdBook = repo.create(bookData);
    const deletedBook = repo.delete(createdBook.id);

    expect(deletedBook).toMatchObject(createdBook);
    expect(repo.getById(createdBook.id)).toBeNull();
  });

  test("should return null if trying to delete a non-existent book", () => {
    const result = repo.delete(999);

    expect(result).toBeNull();
  });

  test("should get a book by id", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Author Name",
      publisher: "Publisher Name",
      genre: ["Fiction"],
      isbnNo: "1234567890",
      numofPages: 300,
      totalNumberOfCopies: 10,
    };

    const createdBook = repo.create(bookData);
    const fetchedBook = repo.getById(createdBook.id);

    expect(fetchedBook).toMatchObject(createdBook);
  });

  test("should return null if trying to get a non-existent book by id", () => {
    const result = repo.getById(999);

    expect(result).toBeNull();
  });

  test("should list books with pagination", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Author Name",
      publisher: "Publisher Name",
      genre: ["Fiction"],
      isbnNo: "1234567890",
      numofPages: 300,
      totalNumberOfCopies: 10,
    };

    repo.create(bookData);
    repo.create({ ...bookData, title: "Another Test Book" });

    const result = repo.list({ limit: 1, offset: 0 });

    expect(result.items.length).toBe(1);
    expect(result.pagination).toEqual({
      offset: 0,
      limit: 1,
      total: 2,
    });
  });

  test("should filter books by search term", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Author Name",
      publisher: "Publisher Name",
      genre: ["Fiction"],
      isbnNo: "1234567890",
      numofPages: 300,
      totalNumberOfCopies: 10,
    };

    repo.create(bookData);
    repo.create({ ...bookData, title: "Another Test Book" });

    const result = repo.list({ limit: 10, offset: 0, search: "another" });

    expect(result.items.length).toBe(1);
    expect(result.items[0].title).toBe("Another Test Book");
  });
});
