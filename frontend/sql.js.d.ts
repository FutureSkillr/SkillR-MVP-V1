declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: (string | number | null)[]): void;
    exec(sql: string, params?: (string | number | null)[]): QueryExecResult[];
    export(): Uint8Array;
    close(): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: (string | number | null)[][];
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  interface InitSqlJsOptions {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(options?: InitSqlJsOptions): Promise<SqlJsStatic>;
  export type { Database, QueryExecResult, SqlJsStatic };
}
