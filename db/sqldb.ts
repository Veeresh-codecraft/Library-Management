//comment yet to updated
import "dotenv/config";
import mysql from "mysql2/promise";

interface DBConfig {
  dbURL: string;
}

class MySQLAdapter {
  private pool: mysql.Pool | null = null;
  private connection: mysql.PoolConnection | null = null;
  constructor(private readonly config: DBConfig) {}
  async load() {
    this.pool = await mysql.createPool(this.config.dbURL);
    this.connection = await this.pool.getConnection();
  }

  async shutDown() {
    this.connection?.release();
    this.pool?.end();
    this.pool = null;
    this.connection = null;
  }
  async runQuery(sql: string): Promise<mysql.QueryResult> {
    if (this.connection) {
      const [result] = await this.connection?.query(sql);
      return result as mysql.QueryResult;
    } else {
      throw new Error("database connection is unsuccessful");
    }
  }
}

export { MySQLAdapter, DBConfig };
