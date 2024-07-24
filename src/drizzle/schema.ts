import { mysqlTable, serial, varchar } from "drizzle-orm/mysql-core";

export const traineeTable = mysqlTable("trainee", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
});
