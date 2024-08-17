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

// Books Table
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

// Users Table
export const usersTable = mysqlTable("users", {
  userId: int("userId").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
});

// Transactions Table
export const transactionsTable = mysqlTable("transactions", {
  transactionId: serial("transactionId").primaryKey().notNull(),
  userId: int("userId")
    .notNull()
    .references(() => usersTable.userId),
  bookId: int("bookId")
    .notNull()
    .references(() => booksTable.id),
  issuedDate: timestamp("issuedDate").defaultNow().notNull(),
  returnDate: varchar("returnDate", { length: 100 }).notNull(),
  isReturned: tinyint("isReturned").default(0).notNull(),
  fine: int("fine").default(0).notNull(),
});

// Refresh Tokens Table
export const refreshTokensTable = mysqlTable("refresh_tokens", {
  id: serial("id").primaryKey().notNull(),
  userId: int("userId")
    .notNull()
    .references(() => usersTable.userId),
  token: text("token").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  ip: text("ip"),
});
