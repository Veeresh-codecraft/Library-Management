import mysql from "mysql2/promise";
import { ColumnData } from "./db";
export interface DBConfig {
  dbURL: string;
}

interface Adapter {
  shutDown: () => Promise<void>;
  runQuery: <T>(sql: string, values: ColumnData[]) => Promise<T | undefined>;
}

export class MySQLAdapter implements Adapter {
  private pool: mysql.Pool;
  constructor(private readonly config: DBConfig) {
    this.pool = mysql.createPool(this.config.dbURL);
  }

  async shutDown() {
    return this.pool.end();
  }

  async runQuery<T>(sql: string, values: ColumnData[]): Promise<T | undefined> {
    let connection: mysql.PoolConnection | null = null;
    try {
      connection = await this.pool.getConnection();
      const [result] = await connection.query(sql, values);
      return result as T;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    } finally {
      if (connection) {
        this.pool.releaseConnection(connection);
      }
    }
  }
}
