import { IBook, IBookBase } from "../../src/book-management/models/books.model";
import { MySqlQueryGenerator } from "../../libs/mysql-query-generator";
import { AppEnvs } from "../../read-env";
import { DBConfig, MySQLAdapter } from "../sqldb";
import { describe, test, beforeEach, afterEach } from "vitest";
import { SimpleWhereExpression } from "../../libs/types";
describe("MySQL DB Adapter tests", () => {
  const { generateSelectSql } = MySqlQueryGenerator;
  const authorClause: SimpleWhereExpression<IBook> = {
    author: {
      op: "CONTAINS",
      value: "Sudha Murthy",
    },
  };
  const config: DBConfig = {
    dbURL: AppEnvs.DATABASE_URL,
  };
  const db = new MySQLAdapter(config);

  beforeEach(async () => {
    await db.load();
  });
  afterEach(async () => {
    await db.shutDown();
  });
  test("SELECT", async () => {
    const selectQuery = generateSelectSql<IBookBase>(
      "books",
      [],
      authorClause,
      0,
      10
    );

    console.log(selectQuery);

    const result = await db.runQuery(selectQuery);
    console.log(result);
  });
});
