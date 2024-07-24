import { defineConfig } from "drizzle-kit";
import { AppEnvs } from "./read-env";

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle/migration",
  dialect: "mysql",
  dbCredentials: {
    url: AppEnvs.DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
});
