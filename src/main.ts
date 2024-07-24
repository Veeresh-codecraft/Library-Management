import { traineeTable } from "./drizzle/migrations/migrations";
import { getDb } from "./drizzle/migrations/migrations";

async function runQuery() {
  const db = await getDb();
  const result = await db
    .insert(traineeTable)
    .values({ name: "mohan", email: "asdf@asdf.com" })
    .execute();
  console.log(result);
}

runQuery();
