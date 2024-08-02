import { int, mysqlTable, serial, varchar } from "drizzle-orm/mysql-core";

export const traineeTable = mysqlTable("trainee", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
});

export const booksTable = mysqlTable("books", {
  id: serial("id").primaryKey().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  publisher: varchar("publisher", { length: 255 }),
  genre: varchar("genre", { length: 100 }),
  isbnNo: varchar("isbnNo", { length: 20 }),
  numofPages: int("numofPages").notNull(),
  totalNumberOfCopies: int("totalNumberOfCopies").notNull(),
  availableNumberOfCopies: int("availableNumberOfCopies").notNull()
});