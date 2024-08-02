import { AppEnv, AppEnvs } from "../../../read-env";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
// Create a function to initialize the database connection and perform migrations
async function migrateDb() {
  // Database URL
  const databaseUrl = "mysql://user:user_password@localhost:3306/library_db";
  //   Connection for migrations
  const migrationConnection = await mysql.createConnection({
    uri: databaseUrl,
    multipleStatements: true, // Required for running migrations
  });
  //   Perform migrations
  await migrate(drizzle(migrationConnection), {
    migrationsFolder:
      "/home/vedanth/library-mgmt/Library-Management/src/drizzle/migration/", // Adjust this path to your migrations folder
  });
  await migrationConnection.end();
}
migrateDb();
