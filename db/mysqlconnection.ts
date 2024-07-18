import mysql, {
  QueryResult,
  PoolConnection as MySqlPoolConn,
} from "mysql2/promise";

export interface DBConfig {
  dbURL: string;
}
// Interface Definitions
export interface IConnection<QR> {
  initialize(): Promise<void>;
  query<T extends QR>(sql: string, values: any): Promise<T>;
}

export interface SqlPoolFactory<QR> {
  acquirePoolConnection(): Promise<PoolConnection<QR>>;
  acquireTransactionPoolConnection(): Promise<TransactionPoolConnection<QR>>;
}

export interface SqlConnectionFactory<QR> {
  acquireConnection(): Promise<StandaloneConnection<QR>>;
  acquireTransactionConnection(): Promise<TransactionConnection<QR>>;
}

// Abstract Class Definitions
export abstract class StandaloneConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract close(): Promise<void>;
}

export abstract class PoolConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract release(): Promise<void>;
}

export abstract class TransactionConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract close(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
}

export abstract class TransactionPoolConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract release(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
}

// Concrete Class Implementations
export class MySqlStandaloneConnection extends StandaloneConnection<QueryResult> {
  private connection: mysql.Connection | undefined;
  constructor(private readonly connectionString: string) {
    super();
  }

  async initialize() {
    if (this.connection) return;
    this.connection = await mysql.createConnection(this.connectionString);
  }

  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }

  async close(): Promise<void> {
    if (!this.connection) return;
    return this.connection.end();
  }
}

export class MySqlPoolConnection extends PoolConnection<QueryResult> {
  private connection: mysql.PoolConnection | undefined | null;
  constructor(private readonly pool: mysql.Pool) {
    super();
  }

  async initialize() {
    if (this.connection) return;
    this.connection = await this.pool.getConnection();
  }

  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }

  async release(): Promise<void> {
    if (!this.connection) return;
    this.connection!.release();
    this.connection = null;
  }
}

export class MySqlTransactionConnection extends TransactionConnection<QueryResult> {
  private connection: mysql.Connection | undefined;
  constructor(private readonly connectionString: string) {
    super();
  }

  async initialize() {
    if (this.connection) return;
    this.connection = await mysql.createConnection(this.connectionString);
    await this.connection.beginTransaction();
  }

  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }

  async commit(): Promise<void> {
    if (!this.connection) return;
    return this.connection.commit();
  }

  async rollback(): Promise<void> {
    if (!this.connection) return;
    return this.connection.rollback();
  }

  async close(): Promise<void> {
    if (!this.connection) return;
    return this.connection.end();
  }
}

export class MySqlTransactionPoolConnection extends TransactionPoolConnection<QueryResult> {
  private connection: MySqlPoolConn | undefined | null;
  constructor(private readonly pool: mysql.Pool) {
    super();
  }

  async initialize() {
    if (this.connection) return;
    this.connection = await this.pool.getConnection();
    await this.connection.beginTransaction();
  }

  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }

  async commit(): Promise<void> {
    if (!this.connection) return;
    return this.connection.commit();
  }

  async rollback(): Promise<void> {
    if (!this.connection) return;
    return this.connection.rollback();
  }

  async release(): Promise<void> {
    if (!this.connection) return;
    this.connection = null;
    return this.connection!.release();
  }
}

export class MySqlPoolFactory implements SqlPoolFactory<QueryResult> {
  private pool: mysql.Pool;

  constructor(private readonly config: DBConfig) {
    this.pool = mysql.createPool(this.config.dbURL);
  }

  async acquirePoolConnection(): Promise<PoolConnection<QueryResult>> {
    const connection = new MySqlPoolConnection(this.pool);
    await connection.initialize();
    return connection;
  }

  async acquireTransactionPoolConnection(): Promise<
    TransactionPoolConnection<QueryResult>
  > {
    const connection = new MySqlTransactionPoolConnection(this.pool);
    await connection.initialize();
    return connection;
  }
}

export class MySqlConnectionFactory
  implements SqlConnectionFactory<QueryResult>
{
  private connectionUrl: string | undefined;
  constructor(private readonly config: DBConfig) {
    this.connectionUrl = config.dbURL;
  }
  async acquireConnection(): Promise<StandaloneConnection<QueryResult>> {
    const connection = new MySqlStandaloneConnection(this.connectionUrl!);
    await connection.initialize();
    return connection;
  }

  async acquireTransactionConnection(): Promise<
    TransactionConnection<QueryResult>
  > {
    const connection = new MySqlTransactionConnection(this.connectionUrl!);
    await connection.initialize();
    return connection;
  }
}
