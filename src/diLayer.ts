import {
  generateCountSql,
  generateDeleteSql,
  generateInsertSql,
  generateSelectSql,
  generateUpdateSql,
  generateWhereClauseSql,
} from "../libs/mysql-query-generator";

import {
  AndWhereExpression,
  OrWhereExpression,
  SimpleWhereExpression,
  WhereExpression,
} from "../libs/types";

import { AppEnvs } from "../read-env";
import { DBConfig, MySQLAdapter } from "../db/sqldb";

import { ColumnData } from "../db/db";

// Define database configuration
const config: DBConfig = {
  dbURL: AppEnvs.DATABASE_URL,
};

// Initialize MySQLAdapter instance
const db = new MySQLAdapter(config);

// Define operation types
type OperationType = "INSERT" | "UPDATE" | "DELETE" | "SELECT" | "COUNT";

// Define query parameters interface
interface QueryParams<Model> {
  tableName: string;
  data?: Array<Partial<Model>>;
  where?:
    | SimpleWhereExpression<Model>
    | AndWhereExpression<Model>
    | OrWhereExpression<Model>;
  fieldsToSelect?: Array<keyof Partial<Model>>;
  offset?: number;
  limit?: number;
}

// Handle database operation function
export const handleDatabaseOperation = async <Model>(
  operation: OperationType,
  params: QueryParams<Model>
): Promise<string | undefined> => {
  let sqlQuery = "";
  let values: ColumnData[] = []; // Initialize values as an empty array
  let whereClause: [string, any[]];
  if (params.where) {
    whereClause = generateWhereClauseSql(params.where);
  }

  switch (operation) {
    case "INSERT":
      if (params.data) {
        const result = generateInsertSql(params.tableName, params.data);
        sqlQuery = result.sqlQuery;
        values = result.values;
      } else {
        throw new Error("INSERT operation requires data");
      }
      break;
    case "UPDATE":
      if (params.data) {
        const result = generateUpdateSql(
          params.tableName,
          params.data,
          params.where || ({} as WhereExpression<Model>)
        );
        sqlQuery = result.sqlQuery;
        values = result.values;
      } else {
        throw new Error("UPDATE operation requires data");
      }
      break;
    case "DELETE":
      const result1 = generateDeleteSql(
        params.tableName,
        params.where || ({} as WhereExpression<Model>)
      );
      sqlQuery = result1.sqlQuery;
      values = result1.values;
      break;
    case "SELECT":
      if (params.fieldsToSelect) {
        const result2 = generateSelectSql(
          params.tableName,
          params.fieldsToSelect,
          params.where || ({} as WhereExpression<Model>),
          params.offset || 0,
          params.limit || 10
        );
        sqlQuery = result2.sqlQuery;
        values = result2.values;
        //console.log(sqlQuery,values)
      } else {
        throw new Error(
          "SELECT operation requires at least one field to select"
        );
      }
      break;
    case "COUNT":
      const result3 = generateCountSql(
        params.tableName,
        params.where || ({} as WhereExpression<Model>)
      );
      sqlQuery = result3.sqlQuery;
      values = result3.values;
      break;
    default:
      throw new Error("Invalid operation type");
  }
  console.log(sqlQuery, values);
  const result: string | undefined = await db.runQuery(sqlQuery, values);
  return result;
};
