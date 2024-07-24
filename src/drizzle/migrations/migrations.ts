import { AppEnv, AppEnvs } from "../../../read-env";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { traineeTable } from "../schema";
import { migrate } from "drizzle-orm/mysql2/migrator";
// Create a function to initialize the database connection and perform migrations
async function initializeDb() {
  // Database URL
  const databaseUrl = "mysql://user:user_password@localhost:3306/library_db";
  //   Connection for migrations
  const migrationClient = await mysql.createConnection({
    uri: databaseUrl,
    multipleStatements: true, // Required for running migrations
  });
  //   Perform migrations
  await migrate(drizzle(migrationClient), {
    migrationsFolder:
      "/home/vedanth/library-mgmt/Library-Management/src/drizzle/migration/", // Adjust this path to your migrations folder
  });
  //   Connection pool for queries
  const pool = mysql.createPool({
    uri: databaseUrl,
  });
  // Create and return the `db` instance
  return drizzle(pool);
}
// Export the `db` instance and `UserTable` after initialization
let db: ReturnType<typeof drizzle> | undefined;
export async function getDb() {
  if (!db) {
    db = await initializeDb();
  }
  return db;
}
export { traineeTable };
