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
): string => {
  const processSimpleExp = (exp: SimpleWhereExpression<Model>) => {
    const whereQuery = Object.entries(exp)
      .map(([key, opts]) => {
        const columnName = `\`${key}\``;
        const paramValue: WhereParamValue = opts as WhereParamValue;
        let value = `${paramValue.value}`;
        let operator = "";
        if (paramValue.value === null) {
          if (paramValue.op === "EQUALS") {
            operator = " IS ";
          } else {
            operator = " IS NOT ";
          }
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

        if (typeof paramValue.value === "string") {
          value = `"${value}"`;
        }
        return `${columnName} ${operator} ${value}`;
      })
      .join(" AND ");
    return whereQuery;
  };

  const whKeys = Object.keys(whereParams);

  if (whKeys.includes("AND")) {
    //it's an AndWhereExpression
    const andClause = (whereParams as AndWhereExpression<Model>).AND.map(
      (exp) => generateWhereClauseSql(exp)
    )
      .filter((c) => c)
      .join(" AND ");
    return andClause ? `(${andClause})` : "";
  } else if (whKeys.includes("OR")) {
    //it's an OrWhereExpression
    const orClause = (whereParams as OrWhereExpression<Model>).OR.map((exp) =>
      generateWhereClauseSql(exp)
    )
      .filter((c) => c)
      .join(" OR ");
    return orClause ? `(${orClause})` : "";
  } else {
    //it's a SimpleWhereExpression
    const simpleClause = processSimpleExp(
      whereParams as SimpleWhereExpression<Model>
    );
    return simpleClause ? `(${simpleClause})` : "";
  }
};

const generateInsertSql = <Model>(tableName: string, row: Model): string => {
  let columns = "";
  let values = "";

  Object.entries(row as object).forEach(([key, value]) => {
    if (columns) columns += ", ";
    columns += `\`${key}\``;

    if (values) values += ", ";
    if (typeof value === "string") {
      values += `"${value}"`;
    } else {
      values += `${value}`;
    }
  });

  let sql = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;

  return sql;
};

const generateUpdateSql = <Model>(
  tableName: string,
  row: Partial<Model>,
  where: WhereExpression<Model>
): string => {
  const setClause = Object.entries(row as object)
    .map(([key, value]: [string, ColumnData]) => {
      const columnName = `\`${key}\``;
      let formattedValue =
        typeof value === "string" ? `"${value}"` : `${value}`;
      return `${columnName} = ${formattedValue}`;
    })
    .join(", ");

  const whereClause = generateWhereClauseSql<Model>(where);

  let sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;

  return sql;
};

const generateDeleteSql = <Model>(
  tableName: string,
  where: WhereExpression<Model>
): string => {
  const whereClause = generateWhereClauseSql<Model>(where);

  let sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;

  return sql;
};

function sanitiesedField(field: string) {
  let fieldWithBacktick = field.startsWith("`") ? field : "`" + field;
  fieldWithBacktick = field.endsWith("`") ? field : "`" + field;
  return fieldWithBacktick;
}

const generateSelectSql = <Model>(
  tableName: string,
  fieldsToSelect: Array<keyof Partial<Model>>,
  where: WhereExpression<Model>,
  offset: number,
  limit: number
): string => {
  const sanitiesedFields = fieldsToSelect.map((field) => {
    sanitiesedField(field as string);
  });
  const selectClause = sanitiesedFields.length
    ? sanitiesedFields.join(", ")
    : "*";
  //const selectClause = fieldsToSelect.length ? fieldsToSelect.join(", ") : "*";
  const whereClause = generateWhereClauseSql<Model>(where);

  let sql = `SELECT ${selectClause} FROM ${tableName}`;
  sql += whereClause ? ` WHERE ${whereClause} ` : "";
  sql += `LIMIT ${limit} OFFSET ${offset}`;

  return sql;
};

const generateCountSql = <Model>(
  tableName: string,
  where?: WhereExpression<Model>
): string => {
  const whereClause = where ? `${generateWhereClauseSql<Model>(where)}` : "";

  let sql = `
    SELECT COUNT(*) AS \`count\` FROM ${tableName} ${whereClause}
    `;

  return sql;
};

export const MySqlQueryGenerator = {
  generateWhereClauseSql,
  generateInsertSql,
  generateUpdateSql,
  generateDeleteSql,
  generateSelectSql,
  generateCountSql,
};
