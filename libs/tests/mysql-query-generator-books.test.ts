import { describe, test, expect } from "vitest";
import { MySqlQueryGenerator } from "../mysql-query-generator";
import {
  OrWhereExpression,
  SimpleWhereExpression,
  WhereExpression,
} from "../types";
import { IBook } from "../../src/book-management/models/books.model";
describe.skip("test on sql generator with quering on books", () => {
  const { generateSelectSql } = MySqlQueryGenerator;
  const authorClause: SimpleWhereExpression<IBook> = {
    author: {
      op: "CONTAINS",
      value: "Sudha Murthy",
    },
  };
  const authAndPublisher: SimpleWhereExpression<IBook> = {
    author: {
      op: "CONTAINS",
      value: "Sudha Murthy",
    },
    publisher: {
      op: "EQUALS",
      value: "Penguin UK",
    },
  };
  const authAndPublisherOrCopies: OrWhereExpression<IBook> = {
    OR: [
      {
        author: {
          op: "CONTAINS",
          value: "Sudha Murthy",
        },
        publisher: {
          op: "EQUALS",
          value: "Penguin UK",
        },
      },
      {
        totalNumberOfCopies: {
          op: "GREATER_THAN_EQUALS",
          value: 10,
        },
      },
    ],
  };
  const authOrTotalNoCopies: OrWhereExpression<IBook> = {
    OR: [
      {
        author: {
          op: "EQUALS",
          value: "Sudha Murthy",
        },
      },
      {
        totalNumberOfCopies: {
          op: "GREATER_THAN_EQUALS",
          value: 10,
        },
      },
    ],
  };
  test("where clause generator", () => {
    //author like Sudha Murthy

    const queryStr =
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(authorClause);
    expect(queryStr).toEqual('(`author`  LIKE  "%Sudha Murthy%")');

    const authAndPublisherQuery =
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(authAndPublisher);
    expect(authAndPublisherQuery).toEqual(
      '(`author`  LIKE  "%Sudha Murthy%" AND `publisher`  =  "Penguin UK")'
    );

    const authAndPublisherOrCopiesQuery =
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(
        authAndPublisherOrCopies
      );
    expect(authAndPublisherOrCopiesQuery).toEqual(
      '((`author`  LIKE  "%Sudha Murthy%" AND `publisher`  =  "Penguin UK") OR (`totalNumberOfCopies`  >=  10))'
    );

    const authOrTotalNoCopiesQuery =
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(authOrTotalNoCopies);
    expect(authOrTotalNoCopiesQuery).toEqual(
      '((`author`  =  "Sudha Murthy") OR (`totalNumberOfCopies`  >=  10))'
    );
  });

  test("select test", () => {
    //SELECT * FROM books WHERE (`author`  LIKE  "%Sudha Murthy%")
    const selectByAuthor = generateSelectSql<IBook>(
      "books",
      [],
      authorClause,
      0,
      10
    );
    expect(selectByAuthor).toEqual(
      'SELECT * FROM books WHERE (`author`  LIKE  "%Sudha Murthy%") LIMIT 10 OFFSET 0'
    );

    const selectauthAndPublisherOrCopies = generateSelectSql<IBook>(
      "books",
      [],
      authAndPublisherOrCopies,
      0,
      10
    );
    expect(selectauthAndPublisherOrCopies).toEqual(
      'SELECT * FROM books WHERE ((`author`  LIKE  "%Sudha Murthy%" AND `publisher`  =  "Penguin UK") OR (`totalNumberOfCopies`  >=  10)) LIMIT 10 OFFSET 0'
    );
  });
});
