import {
  AndWhereExpression,
  ColumnData,
  OrWhereExpression,
  SimpleWhereExpression,
  StringOperator,
  WhereExpression,
  WhereParamValue,
} from "./types";

const generateWhereClauseSql = <Model>(
  whereParams: WhereExpression<Model>
): [string, any[]] => {
  let whereValues: any[] = [];

  const processSimpleExp = (exp: SimpleWhereExpression<Model>): string => {
    const whereQuery = Object.entries(exp)
      .map(([key, opts]) => {
        const columnName = `\`${key}\``;
        const paramValue: WhereParamValue = opts as WhereParamValue;
        let value = paramValue.value;
        let operator = "";

        if (paramValue.value === null) {
          operator = paramValue.op === "EQUALS" ? " IS " : " IS NOT ";
        } else {
          switch (paramValue.op) {
            case "EQUALS":
              operator = " = ";
              break;
            case "NOT_EQUALS":
              operator = " != ";
              break;
            case "STARTS_WITH":
              operator = " LIKE ";
              value = `${value}%`;
              break;
            case "NOT_STARTS_WITH":
              operator = " NOT LIKE ";
              value = `${value}%`;
              break;
            case "ENDS_WITH":
              operator = " LIKE ";
              value = `%${value}`;
              break;
            case "NOT_ENDS_WITH":
              operator = " NOT LIKE ";
              value = `%${value}`;
              break;
            case "CONTAINS":
              operator = " LIKE ";
              value = `%${value}%`;
              break;
            case "NOT_CONTAINS":
              operator = " NOT LIKE ";
              value = `%${value}%`;
              break;
            case "GREATER_THAN":
              operator = " > ";
              break;
            case "GREATER_THAN_EQUALS":
              operator = " >= ";
              break;
            case "LESSER_THAN":
              operator = " < ";
              break;
            case "LESSER_THAN_EQUALS":
              operator = " <= ";
              break;
          }
        }

        whereValues.push(paramValue.value);
        return `${columnName} ${operator} ?`;
      })
      .join(" AND ");
    return whereQuery;
  };

  const whKeys = Object.keys(whereParams);

  let whereClause = "";

  if (whKeys.includes("AND")) {
    // it's an AndWhereExpression
    const andClauses = (whereParams as AndWhereExpression<Model>).AND.map(
      (exp) => {
        const [clause, values] = generateWhereClauseSql(exp);
        whereValues.push(...values);
        return clause;
      }
    )
      .filter((c) => c)
      .join(" AND ");
    whereClause = andClauses ? `(${andClauses})` : "";
  } else if (whKeys.includes("OR")) {
    // it's an OrWhereExpression
    const orClauses = (whereParams as OrWhereExpression<Model>).OR.map(
      (exp) => {
        const [clause, values] = generateWhereClauseSql(exp);
        whereValues.push(...values);
        return clause;
      }
    )
      .filter((c) => c)
      .join(" OR ");
    whereClause = orClauses ? `(${orClauses})` : "";
  } else {
    // it's a SimpleWhereExpression
    const simpleClause = processSimpleExp(
      whereParams as SimpleWhereExpression<Model>
    );
    whereClause = simpleClause ? `(${simpleClause})` : "";
  }

  return [whereClause, whereValues];
};
interface Query {
  sqlQuery: string;
  values: any[];
}
const generateInsertSql = <Model extends { [key: string]: any }>(
  tableName: string,
  rows: Model[]
): Query => {
  if (rows.length === 0) {
    throw new Error("Rows array cannot be empty");
  }

  let columns = "";
  let placeholders = "";
  let values: Array<any> = [];

  Object.entries(rows[0]).forEach(([key], index) => {
    if (columns) {
      columns += ", ";
      placeholders += ", ";
    }
    columns += `\`${key}\``;
    placeholders += "?";
  });

  const rowPlaceholders = `(${placeholders})`;
  const allPlaceholders = rows.map(() => rowPlaceholders).join(", ");
  values = rows.flatMap((row) =>
    Object.values(row).map((value) =>
      typeof value === "string" ? `${value}` : value
    )
  );
  const sqlQuery = `INSERT INTO \`${tableName}\` (${columns}) VALUES ${allPlaceholders}`;
  return { sqlQuery, values };
};

const generateUpdateSql = <Model>(
  tableName: string,
  row: Array<Partial<Model>>,
  where: WhereExpression<Model>
): Query => {
  let updateValues: ColumnData[] = [];
  const setClause = Object.entries(row[0] as object)
    .map(([key, value]: [string, ColumnData]) => {
      const columnName = `\`${key}\``;
      let formattedValue = typeof value === "string" ? `${value}` : value;
      updateValues.push(formattedValue);
      return `${columnName} = ?`;
    })
    .join(", ");

  const [whereClause, whereValues] = generateWhereClauseSql<Model>(where);
  const values = updateValues.concat(whereValues);
  let sqlQuery = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
  return { sqlQuery, values };
};

const generateDeleteSql = <Model>(
  tableName: string,
  where: WhereExpression<Model>
): Query => {
  const [whereClause, values] = generateWhereClauseSql<Model>(where);

  let sqlQuery = `DELETE FROM ${tableName} WHERE ${whereClause}`;

  return { sqlQuery, values };
};

// function sanitisedField(field: string): string {
//   if (!field.startsWith("`")) {
//     field = "`" + field;
//   }
//   if (!field.endsWith("`")) {
//     field = field + "`";
//   }
//   return field;
// }

const generateSelectSql = <Model>(
  tableName: string,
  fieldsToSelect: Array<keyof Partial<Model>>,
  where: WhereExpression<Model>,
  offset: number,
  limit: number
): Query => {
  // const sanitiesedFields = fieldsToSelect.map((field) => {
  //   sanitisedField(field as string);
  // });
  // const selectClause = sanitiesedFields.length
  //   ? sanitiesedFields.join(", ")
  //   : "*";
  const selectClause = fieldsToSelect.length ? fieldsToSelect.join(", ") : "*";
  const [whereClause, values] = generateWhereClauseSql<Model>(where);

  let sqlQuery = `SELECT ${selectClause} FROM ${tableName}`;
  sqlQuery += whereClause ? ` WHERE ${whereClause} ` : "";
  sqlQuery += `LIMIT ${limit} OFFSET ${offset}`;

  return { sqlQuery, values };
};

const generateCountSql = <Model>(
  tableName: string,
  where?: WhereExpression<Model>
): Query => {
  let [whereClause, values] = ["", [""]];
  if (where) {
    [whereClause, values] = generateWhereClauseSql<Model>(where);
  }
  let sqlQuery = `
    SELECT COUNT(*) AS \`count\` FROM ${tableName} WHERE ${whereClause}
    `;

  return { sqlQuery, values };
};

export const MySqlQueryGenerator = {
  generateWhereClauseSql,
  generateInsertSql,
  generateUpdateSql,
  generateDeleteSql,
  generateSelectSql,
  generateCountSql,
};

export {
  generateWhereClauseSql,
  generateInsertSql,
  generateUpdateSql,
  generateDeleteSql,
  generateSelectSql,
  generateCountSql,
};
