/**
 * Browser-side database client that proxies queries to /api/db-proxy.
 * Provides the same fluent API: .from(table).select().eq().single() etc.
 */

type FilterMethod =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "is"
  | "in"
  | "contains"
  | "containedBy"
  | "not"
  | "or"
  | "filter"
  | "match"
  | "textSearch"
  | "overlaps";

interface QueryResult<T = any> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

class BrowserQueryBuilder {
  private table: string;
  private operation: string = "select";
  private columns: string = "*";
  private selectOptions: Record<string, any> = {};
  private filters: { method: string; args: any[] }[] = [];
  private orderByList: { column: string; ascending: boolean }[] = [];
  private rangeFrom?: number;
  private rangeTo?: number;
  private limitCount?: number;
  private insertData?: any;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private selectAfterMutation?: string;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string, options?: Record<string, any>): this {
    this.operation = "select";
    if (columns) this.columns = columns;
    if (options) this.selectOptions = options;
    return this;
  }

  insert(data: any): this {
    this.operation = "insert";
    this.insertData = data;
    return this;
  }

  update(data: any): this {
    this.operation = "update";
    this.insertData = data;
    return this;
  }

  delete(): this {
    this.operation = "delete";
    return this;
  }

  upsert(data: any, options?: Record<string, any>): this {
    this.operation = "upsert";
    this.insertData = data;
    if (options) this.selectOptions = options;
    return this;
  }

  // After insert/update/upsert, allow .select() to return the result
  private applySelect(columns?: string): this {
    if (this.operation !== "select") {
      this.selectAfterMutation = columns || "*";
    } else {
      if (columns) this.columns = columns;
    }
    return this;
  }

  // Filter methods
  eq(column: string, value: any): this {
    this.filters.push({ method: "eq", args: [column, value] });
    return this;
  }

  neq(column: string, value: any): this {
    this.filters.push({ method: "neq", args: [column, value] });
    return this;
  }

  gt(column: string, value: any): this {
    this.filters.push({ method: "gt", args: [column, value] });
    return this;
  }

  gte(column: string, value: any): this {
    this.filters.push({ method: "gte", args: [column, value] });
    return this;
  }

  lt(column: string, value: any): this {
    this.filters.push({ method: "lt", args: [column, value] });
    return this;
  }

  lte(column: string, value: any): this {
    this.filters.push({ method: "lte", args: [column, value] });
    return this;
  }

  like(column: string, pattern: string): this {
    this.filters.push({ method: "like", args: [column, pattern] });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.filters.push({ method: "ilike", args: [column, pattern] });
    return this;
  }

  is(column: string, value: any): this {
    this.filters.push({ method: "is", args: [column, value] });
    return this;
  }

  in(column: string, values: any[]): this {
    this.filters.push({ method: "in", args: [column, values] });
    return this;
  }

  contains(column: string, value: any): this {
    this.filters.push({ method: "contains", args: [column, value] });
    return this;
  }

  containedBy(column: string, value: any): this {
    this.filters.push({ method: "containedBy", args: [column, value] });
    return this;
  }

  not(column: string, operator: string, value: any): this {
    this.filters.push({ method: "not", args: [column, operator, value] });
    return this;
  }

  or(filterString: string): this {
    this.filters.push({ method: "or", args: [filterString] });
    return this;
  }

  filter(column: string, operator: string, value: any): this {
    this.filters.push({ method: "filter", args: [column, operator, value] });
    return this;
  }

  match(query: Record<string, any>): this {
    this.filters.push({ method: "match", args: [query] });
    return this;
  }

  textSearch(column: string, query: string, options?: Record<string, any>): this {
    this.filters.push({ method: "textSearch", args: [column, query, options] });
    return this;
  }

  overlaps(column: string, value: any): this {
    this.filters.push({ method: "overlaps", args: [column, value] });
    return this;
  }

  // Modifiers
  order(column: string, options?: { ascending?: boolean }): this {
    this.orderByList.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  range(from: number, to: number): this {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  maybeSingle(): this {
    this.isMaybeSingle = true;
    return this;
  }

  // Execute the query
  private async execute(): Promise<QueryResult> {
    try {
      const body: Record<string, any> = {
        table: this.table,
        operation: this.operation,
        filters: this.filters,
      };

      if (this.operation === "select") {
        body.columns = this.columns;
        body.options = this.selectOptions;
      } else {
        body.data = this.insertData;
        if (this.selectAfterMutation) {
          body.columns = this.selectAfterMutation;
        }
        if (this.operation === "upsert") {
          body.options = this.selectOptions;
        }
      }

      if (this.orderByList.length > 0) {
        body.orderBy = this.orderByList;
      }
      if (this.rangeFrom !== undefined && this.rangeTo !== undefined) {
        body.rangeFrom = this.rangeFrom;
        body.rangeTo = this.rangeTo;
      }
      if (this.limitCount !== undefined) {
        body.limitCount = this.limitCount;
      }

      // Add single/maybeSingle as filters so the proxy can handle them
      if (this.isSingle) {
        body.filters.push({ method: "single", args: [] });
      } else if (this.isMaybeSingle) {
        body.filters.push({ method: "maybeSingle", args: [] });
      }

      const response = await fetch("/api/db-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : "Network error" },
      };
    }
  }

  // Thenable - allows awaiting the builder directly
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Overload select to handle post-mutation .select()
const originalSelect = BrowserQueryBuilder.prototype.select;
BrowserQueryBuilder.prototype.select = function (
  this: BrowserQueryBuilder & { operation: string; selectAfterMutation?: string; columns: string },
  columns?: string,
  options?: Record<string, any>
) {
  if (this.operation !== "select" && this.operation !== undefined) {
    // This is a .select() after .insert()/.update()/.upsert()
    (this as any).selectAfterMutation = columns || "*";
    return this;
  }
  return originalSelect.call(this, columns, options);
};

class BrowserDatabaseClient {
  from(table: string): BrowserQueryBuilder {
    return new BrowserQueryBuilder(table);
  }

  async rpc(fn: string, params?: Record<string, any>): Promise<QueryResult> {
    try {
      const response = await fetch("/api/db-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rpc: fn, rpcParams: params }),
      });
      return response.json();
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : "Network error" },
      };
    }
  }

  // Stub for realtime - will be replaced by Socket.io
  channel(name: string) {
    return new StubChannel(name);
  }

  removeChannel(_channel: any) {
    // no-op
  }

  // Stub for auth - handled by AuthProvider/Auth.js
  auth = {
    getUser: async () => ({
      data: { user: null },
      error: null,
    }),
    getSession: async () => ({
      data: { session: null },
      error: null,
    }),
    onAuthStateChange: (_callback: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  };

  // Stub for storage - handled by /api/upload
  storage = {
    from: (_bucket: string) => ({
      upload: async () => ({ data: null, error: { message: "Use /api/upload instead" } }),
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `/uploads/${path}` },
      }),
    }),
  };
}

class StubChannel {
  private name: string;
  private handlers: Map<string, Function[]> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  on(event: string, _filter: any, callback?: Function): this {
    // Store handlers in case code checks them, but they won't fire
    // Realtime is handled by Socket.io
    if (callback) {
      const handlers = this.handlers.get(event) || [];
      handlers.push(callback);
      this.handlers.set(event, handlers);
    }
    return this;
  }

  subscribe(callback?: Function): this {
    // Immediately call callback with "SUBSCRIBED" status for compatibility
    if (callback) {
      setTimeout(() => callback("SUBSCRIBED"), 0);
    }
    return this;
  }

  unsubscribe(): this {
    this.handlers.clear();
    return this;
  }

  track(_payload: any): this {
    return this;
  }

  untrack(): this {
    return this;
  }

  send(_payload: any): this {
    return this;
  }
}

// Singleton
let browserClient: BrowserDatabaseClient | null = null;

export function createClient(): BrowserDatabaseClient {
  if (!browserClient) {
    browserClient = new BrowserDatabaseClient();
  }
  return browserClient;
}
