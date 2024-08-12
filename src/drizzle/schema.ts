import { sql } from "drizzle-orm";
import {
  date,
  int,
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  unique,
  bigint,
  tinyint,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { UserRole } from "../user-management/userRole";
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
  availableNumberOfCopies: int("availableNumberOfCopies").notNull(),
});

export const usersTable = mysqlTable("users", {
  userId: int("userId").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
});

export const transaction = mysqlTable("transactions", {
  transactionId: int("transactionId").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  bookId: int("bookId").notNull(),
  issueddate: timestamp("issueddate").defaultNow().notNull(),
  returnDate: varchar("returnDate", { length: 100 }).notNull(),
  isReturned: tinyint("isReturned").default(0).notNull(),
  fine: int("fine").default(0).notNull(),
});
