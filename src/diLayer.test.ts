import { describe, test, expect } from "vitest";
import { handleDatabaseOperation } from "./diLayer";
import { IBook, IBookBase } from "./book-management/models/books.model";
import { OrWhereExpression, SimpleWhereExpression } from "../libs/types";

describe("tests of functionality of execution of middle layer", () => {
  const bookData = [
    {
      title: "fun coding",
      author: "ved",
      publisher: "cc",
      genre: "compute",
      isbnNo: "7474747489098",
      numofPages: 89,
      totalNumberOfCopies: 9,
      availableNumberOfCopies: 9,
    },
    {
      title: "Mastering TypeScript",
      author: "Jane Doe",
      publisher: "Tech Books Publishing",
      genre: "Programming",
      isbnNo: "9781234567890",
      numofPages: 350,
      totalNumberOfCopies: 15,
      availableNumberOfCopies: 15,
    },
  ];

  // test("test to insert into books table", async () => {
  //   const result = await handleDatabaseOperation<IBookBase>("INSERT", {
  //     tableName: "books",
  //     data: bookData,
  //   });
  //   console.log(result);
  //   expect(result).toBeDefined();
  // });

  // test("test to update books table", async () => {
  //   const updateData = [{ title: "fun coding", author: "veda" }];
  // const whereParams: OrWhereExpression<IBook> = {
  //   OR: [
  //     {
  //       publisher: {
  //         op: "EQUALS",
  //         value: "Tech Books Publishing",
  //       },
  //     },
  //     {
  //       totalNumberOfCopies: {
  //         op: "GREATER_THAN_EQUALS",
  //         value: 200,
  //       },
  //     },
  //   ],
  // };

  //   const result = await handleDatabaseOperation<IBook>("UPDATE", {
  //     tableName: "books",
  //     data: updateData,
  //     where: whereParams,
  //   });

  //   expect(result).toBeDefined();
  //   //expect(result.affectedRows).toBeGreaterThan(0);
  // });

  // test("test to select from books table", async () => {
    // const whereParams: SimpleWhereExpression<IBook> = {
    //   id: { op: "EQUALS", value: 9 },
    // };

    // const result = await handleDatabaseOperation<IBook>("SELECT", {
    //   tableName: "books ",
    //   fieldsToSelect: [],
    //   //where: whereParams,
    //   offset: 0,
    //   limit: 5,
    // });

  //   console.log(result);
  //   expect(result).toBeDefined();
  // });

  test("test to count rows in books table", async () => {
    const whereParams: OrWhereExpression<IBook> = {
      OR: [
        {
          publisher: {
            op: "NOT_EQUALS",
            value: "Tech Books Publishing",
          },
        },
        {
          totalNumberOfCopies: {
            op: "GREATER_THAN_EQUALS",
            value: 15,
          },
        },
      ],
    };

    const result = await handleDatabaseOperation<IBook>("COUNT", {
      tableName: "books",
      where: whereParams,
    });

    console.log(result);
    expect(result).toBeDefined();
    //expect(result[0].count).toBeGreaterThanOrEqual(0);
  });
  // test("test to delete a book",async  () => {
  //   const whereParams: SimpleWhereExpression<IBook> = {
  //     id: { op: "EQUALS", value: 8 },
  //   };
  //   const result = await handleDatabaseOperation("DELETE", {
  //     tableName: "books",
  //     where: whereParams,
  //   });
  //   console.log(result)
  // });
});
