/**
 * Fluent query builder for raw PostgreSQL (porsager/postgres).
 *
 * Supports the fluent API patterns used across all API routes:
 *   db.from("table").select("*").eq("col", val).order("col").range(0, 9).single()
 *   db.from("table").select("*, rel:table!fk(cols)").eq("id", val).single()
 *   db.from("table").insert({ ... }).select().single()
 *   db.from("table").update({ ... }).eq("id", val).select().single()
 *   db.from("table").delete().eq("id", val)
 *   db.from("table").upsert({ ... }, { onConflict: "col" }).select().single()
 *   db.rpc("function_name", { param: val })
 *
 * Returns { data, error, count? } matching the standard { data, error, count } response shape.
 */

import type postgres from "postgres";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QueryResult<T = Record<string, unknown>> {
  data: T | null;
  error: QueryError | null;
  count?: number | null;
}

export interface QueryError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

type FilterOp =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte"
  | "like" | "ilike" | "is" | "in"
  | "contains" | "containedBy" | "overlaps" | "textSearch";

interface Filter {
  op: FilterOp;
  column: string;
  value: unknown;
}

interface NotFilter {
  column: string;
  op: string;
  value: unknown;
}

interface OrFilter {
  raw: string;
}

interface OrderClause {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
}

// ─── Foreign Key Schema Cache ────────────────────────────────────────────────

interface FKInfo {
  constraintName: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

let _fkCache: FKInfo[] | null = null;
let _fkCachePromise: Promise<FKInfo[]> | null = null;

async function getForeignKeys(sql: postgres.Sql): Promise<FKInfo[]> {
  if (_fkCache) return _fkCache;
  if (_fkCachePromise) return _fkCachePromise;

  _fkCachePromise = (async () => {
    const rows = await sql.unsafe(`
      SELECT
        tc.constraint_name,
        tc.table_name AS from_table,
        kcu.column_name AS from_column,
        ccu.table_name AS to_table,
        ccu.column_name AS to_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);

    _fkCache = rows.map((r) => ({
      constraintName: r.constraint_name as string,
      fromTable: r.from_table as string,
      fromColumn: r.from_column as string,
      toTable: r.to_table as string,
      toColumn: r.to_column as string,
    }));
    return _fkCache;
  })();

  return _fkCachePromise;
}

/** Clear FK cache (for testing or schema changes) */
export function clearSchemaCache() {
  _fkCache = null;
  _fkCachePromise = null;
}

// ─── Join Reference Parsing ──────────────────────────────────────────────────

interface JoinRef {
  alias: string;
  table: string;
  constraintName: string | null;
  isInner: boolean;
  columns: string; // e.g., "id, username" or "*"
}

interface ParsedSelect {
  mainColumns: string;
  joins: JoinRef[];
}

/**
 * Parse select string with embedded join references.
 *
 * Examples:
 *   "*" → { mainColumns: "*", joins: [] }
 *   "id, username" → { mainColumns: "id, username", joins: [] }
 *   "*, creator:profiles!fk_name(id, username)" → { mainColumns: "*", joins: [...] }
 *   "*, profile:profiles!user_id(username, display_name)" → { mainColumns: "*", joins: [...] }
 */
function parseSelectString(selectStr: string): ParsedSelect {
  if (!selectStr || selectStr.trim() === "*") {
    return { mainColumns: "*", joins: [] };
  }

  const joins: JoinRef[] = [];
  const mainParts: string[] = [];

  // Split top-level by commas, respecting parentheses depth
  const tokens = splitTopLevel(selectStr);

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    // Check for join reference pattern: alias:table!constraint(cols) or alias:table(cols)
    const joinMatch = trimmed.match(
      /^(\w+):(\w+)(?:!(inner|\w+))?(?:!(inner))?(?:\(([^)]*)\))?$/
    );

    if (joinMatch && joinMatch[5] !== undefined) {
      const [, alias, table, hint1, hint2, cols] = joinMatch;
      let constraintName: string | null = null;
      let isInner = false;

      if (hint1 === "inner") {
        isInner = true;
      } else if (hint1) {
        constraintName = hint1;
      }
      if (hint2 === "inner") {
        isInner = true;
      }

      joins.push({
        alias,
        table,
        constraintName,
        isInner,
        columns: cols || "*",
      });
    } else {
      // Regular column
      mainParts.push(trimmed);
    }
  }

  return {
    mainColumns: mainParts.length > 0 ? mainParts.join(", ") : "*",
    joins,
  };
}

/** Split a string by commas at the top level only (not inside parentheses) */
function splitTopLevel(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const ch of str) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;

    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapError(err: unknown): QueryError {
  if (err instanceof Error) {
    const pgErr = err as Error & { code?: string; detail?: string; hint?: string };
    return {
      message: pgErr.message,
      code: pgErr.code,
      details: pgErr.detail,
      hint: pgErr.hint,
    };
  }
  return { message: String(err) };
}

/** Quote a SQL identifier */
function qi(name: string): string {
  if (name === "*") return "*";
  return name
    .split(".")
    .map((part) => {
      if (part === "*" || part.startsWith('"')) return part;
      return `"${part.replace(/"/g, '""')}"`;
    })
    .join(".");
}

/** Build a safe column list for SELECT */
function buildColumnList(cols: string): string {
  if (!cols || cols.trim() === "*") return "*";
  return cols
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map(qi)
    .join(", ");
}

/** Parse .or() filter string into SQL */
function parseOrFilter(raw: string, paramIndex: number): { sql: string; params: unknown[]; nextIndex: number } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = paramIndex;

  const parts = splitTopLevel(raw);

  for (const part of parts) {
    const trimmed = part.trim();

    // Nested and()
    if (trimmed.startsWith("and(") && trimmed.endsWith(")")) {
      const inner = trimmed.slice(4, -1);
      const result = parseOrFilter(inner, idx);
      conditions.push(`(${result.sql.replace(/ OR /g, " AND ")})`);
      params.push(...result.params);
      idx = result.nextIndex;
      continue;
    }

    // Format: column.operator.value
    const dotIdx = trimmed.indexOf(".");
    if (dotIdx === -1) continue;

    const column = trimmed.substring(0, dotIdx);
    const rest = trimmed.substring(dotIdx + 1);
    const opDotIdx = rest.indexOf(".");
    const operator = opDotIdx === -1 ? rest : rest.substring(0, opDotIdx);
    const value = opDotIdx === -1 ? null : rest.substring(opDotIdx + 1);

    const colQ = qi(column);
    switch (operator) {
      case "eq":
        conditions.push(`${colQ} = $${idx}`); params.push(value); idx++; break;
      case "neq":
        conditions.push(`${colQ} != $${idx}`); params.push(value); idx++; break;
      case "gt":
        conditions.push(`${colQ} > $${idx}`); params.push(value); idx++; break;
      case "gte":
        conditions.push(`${colQ} >= $${idx}`); params.push(value); idx++; break;
      case "lt":
        conditions.push(`${colQ} < $${idx}`); params.push(value); idx++; break;
      case "lte":
        conditions.push(`${colQ} <= $${idx}`); params.push(value); idx++; break;
      case "like":
        conditions.push(`${colQ} LIKE $${idx}`); params.push(value); idx++; break;
      case "ilike":
        conditions.push(`${colQ} ILIKE $${idx}`); params.push(value); idx++; break;
      case "is":
        if (value === "null") conditions.push(`${colQ} IS NULL`);
        else if (value === "true") conditions.push(`${colQ} IS TRUE`);
        else if (value === "false") conditions.push(`${colQ} IS FALSE`);
        break;
      case "not":
        if (value?.startsWith("is.null")) conditions.push(`${colQ} IS NOT NULL`);
        else { conditions.push(`${colQ} != $${idx}`); params.push(value); idx++; }
        break;
      default:
        conditions.push(`${colQ} = $${idx}`); params.push(value); idx++;
    }
  }

  return { sql: conditions.join(" OR "), params, nextIndex: idx };
}

// ─── Query Builder ───────────────────────────────────────────────────────────

export class QueryBuilder<T = Record<string, unknown>> {
  private _sql: postgres.Sql;
  private _table: string;
  private _operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private _selectColumns: string = "*";
  private _selectOptions: { count?: "exact" | "planned" | "estimated"; head?: boolean } = {};
  private _filters: Filter[] = [];
  private _notFilters: NotFilter[] = [];
  private _orFilters: OrFilter[] = [];
  private _orderClauses: OrderClause[] = [];
  private _rangeFrom?: number;
  private _rangeTo?: number;
  private _limit?: number;
  private _data: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private _upsertOptions: { onConflict?: string; ignoreDuplicates?: boolean } = {};
  private _returnSelect: string | null = null;
  private _single = false;
  private _maybeSingle = false;

  constructor(sql: postgres.Sql, table: string) {
    this._sql = sql;
    this._table = table;
  }

  // ── SELECT ──────────────────────────────────────────────────────────────

  select(columns?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): this {
    if (["insert", "update", "upsert", "delete"].includes(this._operation)) {
      this._returnSelect = columns || "*";
      if (options) this._selectOptions = options;
      return this;
    }
    this._operation = "select";
    this._selectColumns = columns || "*";
    if (options) this._selectOptions = options;
    return this;
  }

  // ── MUTATIONS ───────────────────────────────────────────────────────────

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this._operation = "insert"; this._data = data; return this;
  }

  update(data: Record<string, unknown>): this {
    this._operation = "update"; this._data = data; return this;
  }

  delete(): this {
    this._operation = "delete"; return this;
  }

  upsert(
    data: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean }
  ): this {
    this._operation = "upsert";
    this._data = data;
    if (options) this._upsertOptions = options;
    return this;
  }

  // ── FILTERS ─────────────────────────────────────────────────────────────

  eq(column: string, value: unknown): this { this._filters.push({ op: "eq", column, value }); return this; }
  neq(column: string, value: unknown): this { this._filters.push({ op: "neq", column, value }); return this; }
  gt(column: string, value: unknown): this { this._filters.push({ op: "gt", column, value }); return this; }
  gte(column: string, value: unknown): this { this._filters.push({ op: "gte", column, value }); return this; }
  lt(column: string, value: unknown): this { this._filters.push({ op: "lt", column, value }); return this; }
  lte(column: string, value: unknown): this { this._filters.push({ op: "lte", column, value }); return this; }
  like(column: string, pattern: string): this { this._filters.push({ op: "like", column, value: pattern }); return this; }
  ilike(column: string, pattern: string): this { this._filters.push({ op: "ilike", column, value: pattern }); return this; }

  is(column: string, value: null | boolean): this {
    this._filters.push({ op: "is", column, value }); return this;
  }

  in(column: string, values: unknown[]): this {
    this._filters.push({ op: "in", column, value: values }); return this;
  }

  contains(column: string, value: unknown): this {
    this._filters.push({ op: "contains", column, value }); return this;
  }

  containedBy(column: string, value: unknown): this {
    this._filters.push({ op: "containedBy", column, value }); return this;
  }

  overlaps(column: string, value: unknown[]): this {
    this._filters.push({ op: "overlaps", column, value }); return this;
  }

  textSearch(column: string, query: string, options?: { type?: "plain" | "phrase" | "websearch"; config?: string }): this {
    this._filters.push({ op: "textSearch", column, value: { query, ...(options || {}) } }); return this;
  }

  match(query: Record<string, unknown>): this {
    for (const [column, value] of Object.entries(query)) {
      this._filters.push({ op: "eq", column, value });
    }
    return this;
  }

  not(column: string, op: string, value: unknown): this {
    this._notFilters.push({ column, op, value }); return this;
  }

  or(filterString: string): this {
    this._orFilters.push({ raw: filterString }); return this;
  }

  filter(column: string, operator: string, value: unknown): this {
    const opMap: Record<string, FilterOp> = {
      eq: "eq", neq: "neq", gt: "gt", gte: "gte", lt: "lt", lte: "lte",
      like: "like", ilike: "ilike", is: "is", in: "in",
      cs: "contains", cd: "containedBy", ov: "overlaps",
    };
    this._filters.push({ op: opMap[operator] || "eq", column, value }); return this;
  }

  // ── ORDERING & PAGINATION ───────────────────────────────────────────────

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; referencedTable?: string }): this {
    // referencedTable option is not supported (ordering is on main table)
    this._orderClauses.push({
      column,
      ascending: options?.ascending ?? true,
      nullsFirst: options?.nullsFirst,
    });
    return this;
  }

  range(from: number, to: number): this {
    this._rangeFrom = from; this._rangeTo = to; return this;
  }

  limit(count: number): this {
    this._limit = count; return this;
  }

  // ── RESULT MODIFIERS ────────────────────────────────────────────────────

  single(): Promise<QueryResult<T>> {
    this._single = true;
    return this._execute();
  }

  maybeSingle(): Promise<QueryResult<T | null>> {
    this._maybeSingle = true;
    return this._execute() as Promise<QueryResult<T | null>>;
  }

  // ── THENABLE (so await works without .single()/.maybeSingle()) ──────────

  then<TResult1 = QueryResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(
      onfulfilled as ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>),
      onrejected
    );
  }

  // ─── Internal Execution ─────────────────────────────────────────────────

  private async _execute(): Promise<QueryResult<T>> {
    try {
      switch (this._operation) {
        case "select": return await this._execSelect();
        case "insert": return await this._execInsert();
        case "update": return await this._execUpdate();
        case "delete": return await this._execDelete();
        case "upsert": return await this._execUpsert();
        default: return { data: null, error: { message: `Unknown operation: ${this._operation}` } };
      }
    } catch (err) {
      return { data: null, error: wrapError(err) };
    }
  }

  // ── WHERE clause builder ────────────────────────────────────────────────

  private _buildWhere(startIdx = 1): { sql: string; params: unknown[]; nextIdx: number } {
    const conds: string[] = [];
    const params: unknown[] = [];
    let idx = startIdx;

    for (const f of this._filters) {
      const col = qi(f.column);
      switch (f.op) {
        case "eq": conds.push(`${col} = $${idx}`); params.push(f.value); idx++; break;
        case "neq": conds.push(`${col} != $${idx}`); params.push(f.value); idx++; break;
        case "gt": conds.push(`${col} > $${idx}`); params.push(f.value); idx++; break;
        case "gte": conds.push(`${col} >= $${idx}`); params.push(f.value); idx++; break;
        case "lt": conds.push(`${col} < $${idx}`); params.push(f.value); idx++; break;
        case "lte": conds.push(`${col} <= $${idx}`); params.push(f.value); idx++; break;
        case "like": conds.push(`${col} LIKE $${idx}`); params.push(f.value); idx++; break;
        case "ilike": conds.push(`${col} ILIKE $${idx}`); params.push(f.value); idx++; break;
        case "is":
          if (f.value === null) conds.push(`${col} IS NULL`);
          else if (f.value === true) conds.push(`${col} IS TRUE`);
          else if (f.value === false) conds.push(`${col} IS FALSE`);
          break;
        case "in": {
          const arr = f.value as unknown[];
          if (arr.length === 0) { conds.push("FALSE"); break; }
          conds.push(`${col} IN (${arr.map((_, i) => `$${idx + i}`).join(", ")})`);
          params.push(...arr); idx += arr.length;
          break;
        }
        case "contains":
          if (Array.isArray(f.value)) {
            const arr = f.value as unknown[];
            if (arr.length === 0) break;
            const phs = arr.map((_, i) => `$${idx + i}`).join(", ");
            conds.push(`${col} @> ARRAY[${phs}]::text[]`);
            params.push(...arr); idx += arr.length;
          } else {
            conds.push(`${col} @> $${idx}::jsonb`); params.push(JSON.stringify(f.value)); idx++;
          }
          break;
        case "containedBy":
          if (Array.isArray(f.value)) {
            const arr = f.value as unknown[];
            if (arr.length === 0) { conds.push("FALSE"); break; }
            const phs = arr.map((_, i) => `$${idx + i}`).join(", ");
            conds.push(`${col} <@ ARRAY[${phs}]::text[]`);
            params.push(...arr); idx += arr.length;
          } else {
            conds.push(`${col} <@ $${idx}::jsonb`); params.push(JSON.stringify(f.value)); idx++;
          }
          break;
        case "overlaps": {
          const arr = f.value as unknown[];
          if (arr.length === 0) { conds.push("FALSE"); break; }
          const phs = arr.map((_, i) => `$${idx + i}`).join(", ");
          conds.push(`${col} && ARRAY[${phs}]::text[]`);
          params.push(...arr); idx += arr.length;
          break;
        }
        case "textSearch": {
          const ts = f.value as { query: string; type?: string; config?: string };
          const cfg = ts.config || "english";
          const fn = ts.type === "phrase" ? "phraseto_tsquery" : ts.type === "websearch" ? "websearch_to_tsquery" : "plainto_tsquery";
          conds.push(`${col} @@ ${fn}('${cfg}', $${idx})`); params.push(ts.query); idx++;
          break;
        }
      }
    }

    // NOT filters
    for (const nf of this._notFilters) {
      const col = qi(nf.column);
      switch (nf.op) {
        case "eq": conds.push(`${col} != $${idx}`); params.push(nf.value); idx++; break;
        case "is":
          if (nf.value === null) conds.push(`${col} IS NOT NULL`);
          break;
        case "in": {
          const arr = nf.value as unknown[];
          if (arr.length === 0) break;
          conds.push(`${col} NOT IN (${arr.map((_, i) => `$${idx + i}`).join(", ")})`);
          params.push(...arr); idx += arr.length;
          break;
        }
        case "ilike":
          conds.push(`${col} NOT ILIKE $${idx}`); params.push(nf.value); idx++; break;
        default:
          conds.push(`NOT (${col} = $${idx})`); params.push(nf.value); idx++;
      }
    }

    // OR filters
    for (const orf of this._orFilters) {
      const r = parseOrFilter(orf.raw, idx);
      if (r.sql) { conds.push(`(${r.sql})`); params.push(...r.params); idx = r.nextIndex; }
    }

    return {
      sql: conds.length > 0 ? ` WHERE ${conds.join(" AND ")}` : "",
      params,
      nextIdx: idx,
    };
  }

  private _buildOrder(): string {
    if (this._orderClauses.length === 0) return "";
    return " ORDER BY " + this._orderClauses.map((o) => {
      let s = `${qi(o.column)} ${o.ascending ? "ASC" : "DESC"}`;
      if (o.nullsFirst !== undefined) s += o.nullsFirst ? " NULLS FIRST" : " NULLS LAST";
      return s;
    }).join(", ");
  }

  private _buildLimitOffset(): string {
    if (this._rangeFrom !== undefined && this._rangeTo !== undefined) {
      return ` LIMIT ${this._rangeTo - this._rangeFrom + 1} OFFSET ${this._rangeFrom}`;
    }
    if (this._limit !== undefined) return ` LIMIT ${this._limit}`;
    return "";
  }

  // ── SELECT execution ────────────────────────────────────────────────────

  private async _execSelect(): Promise<QueryResult<T>> {
    const { mainColumns, joins } = parseSelectString(this._selectColumns);
    const cols = buildColumnList(mainColumns);
    const { sql: where, params } = this._buildWhere();
    const order = this._buildOrder();
    const limit = this._buildLimitOffset();
    const table = qi(this._table);

    // Count query (run before main query, shares the same WHERE)
    let count: number | null = null;
    if (this._selectOptions.count) {
      const countQ = `SELECT COUNT(*) AS cnt FROM ${table}${where}`;
      const cr = await this._sql.unsafe(countQ, params);
      count = parseInt(cr[0]?.cnt as string, 10) || 0;
    }

    // Head-only: return count without data
    if (this._selectOptions.head) {
      return { data: null, error: null, count };
    }

    // Main query
    const q = `SELECT ${cols} FROM ${table}${where}${order}${limit}`;
    const rows = await this._sql.unsafe(q, params) as Record<string, unknown>[];

    // Resolve joins if any
    if (joins.length > 0 && rows.length > 0) {
      await this._resolveJoins(rows, joins);
    }

    return this._wrapRows(rows, count);
  }

  /** Resolve foreign-key join references using batched queries */
  private async _resolveJoins(rows: Record<string, unknown>[], joins: JoinRef[]): Promise<void> {
    const fks = await getForeignKeys(this._sql);

    for (const join of joins) {
      const resolved = this._resolveFK(fks, join);

      if (!resolved) {
        // Couldn't determine FK — set alias to null/[] and continue
        rows.forEach((r) => { r[join.alias] = null; });
        continue;
      }

      const { direction, localCol, foreignCol, foreignTable } = resolved;
      const selectCols = join.columns.trim() === "*" ? "*" : buildColumnList(join.columns);

      if (direction === "many-to-one") {
        // Batch: collect unique FK values from rows, query related table
        const fkValues = [...new Set(rows.map((r) => r[localCol]).filter((v) => v != null))];

        if (fkValues.length === 0) {
          rows.forEach((r) => { r[join.alias] = null; });
          continue;
        }

        const placeholders = fkValues.map((_, i) => `$${i + 1}`).join(", ");
        const relQ = `SELECT ${selectCols} FROM ${qi(foreignTable)} WHERE ${qi(foreignCol)} IN (${placeholders})`;
        const related = await this._sql.unsafe(relQ, fkValues);

        const map = new Map<unknown, Record<string, unknown>>();
        for (const r of related) map.set((r as Record<string, unknown>)[foreignCol], r as Record<string, unknown>);

        for (const row of rows) {
          row[join.alias] = map.get(row[localCol]) ?? null;
        }
      } else {
        // one-to-many: related table has FK pointing back to us
        const mainIds = [...new Set(rows.map((r) => r[foreignCol]).filter((v) => v != null))];

        if (mainIds.length === 0) {
          rows.forEach((r) => { r[join.alias] = []; });
          continue;
        }

        const placeholders = mainIds.map((_, i) => `$${i + 1}`).join(", ");
        const relQ = `SELECT ${selectCols} FROM ${qi(foreignTable)} WHERE ${qi(localCol)} IN (${placeholders})`;
        const related = await this._sql.unsafe(relQ, mainIds);

        const groups = new Map<unknown, Record<string, unknown>[]>();
        for (const r of related) {
          const key = (r as Record<string, unknown>)[localCol];
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(r as Record<string, unknown>);
        }

        for (const row of rows) {
          row[join.alias] = groups.get(row[foreignCol]) ?? [];
        }
      }
    }
  }

  /** Determine FK direction and columns for a join reference */
  private _resolveFK(
    fks: FKInfo[],
    join: JoinRef
  ): { direction: "many-to-one" | "one-to-many"; localCol: string; foreignCol: string; foreignTable: string } | null {
    const mainTable = this._table;

    // 1. Explicit constraint name
    if (join.constraintName) {
      const fk = fks.find((f) => f.constraintName === join.constraintName);
      if (fk) {
        if (fk.fromTable === mainTable) {
          // FK is on main table → many-to-one
          return { direction: "many-to-one", localCol: fk.fromColumn, foreignCol: fk.toColumn, foreignTable: join.table };
        } else {
          // FK is on related table → one-to-many
          return { direction: "one-to-many", localCol: fk.fromColumn, foreignCol: fk.toColumn, foreignTable: join.table };
        }
      }

      // Fallback: extract column name from constraint name
      // Format: {table}_{column}_fkey
      const match = join.constraintName.match(/^(?:\w+?)_(.+)_fkey$/);
      if (match) {
        const col = match[1];
        return { direction: "many-to-one", localCol: col, foreignCol: "id", foreignTable: join.table };
      }
    }

    // 2. Look for FK between main table and join table in schema
    // Many-to-one: main table has FK to join table
    const m2o = fks.find((f) => f.fromTable === mainTable && f.toTable === join.table);
    if (m2o) {
      return { direction: "many-to-one", localCol: m2o.fromColumn, foreignCol: m2o.toColumn, foreignTable: join.table };
    }

    // One-to-many: join table has FK to main table
    const o2m = fks.find((f) => f.fromTable === join.table && f.toTable === mainTable);
    if (o2m) {
      return { direction: "one-to-many", localCol: o2m.fromColumn, foreignCol: o2m.toColumn, foreignTable: join.table };
    }

    // 3. Convention-based fallback
    // Try alias_id on main table (many-to-one)
    const aliasCol = `${join.alias}_id`;
    return { direction: "many-to-one", localCol: aliasCol, foreignCol: "id", foreignTable: join.table };
  }

  // ── INSERT execution ────────────────────────────────────────────────────

  private async _execInsert(): Promise<QueryResult<T>> {
    if (!this._data) return { data: null, error: { message: "No data provided for insert" } };

    const rows = Array.isArray(this._data) ? this._data : [this._data];
    if (rows.length === 0) return { data: ([] as unknown) as T, error: null };

    const columns = Object.keys(rows[0]);
    const table = qi(this._table);
    const colNames = columns.map(qi).join(", ");

    const allParams: unknown[] = [];
    const valueSets: string[] = [];
    let idx = 1;

    for (const row of rows) {
      const phs: string[] = [];
      for (const col of columns) {
        const val = row[col];
        if (this._isJsonValue(val)) {
          phs.push(`$${idx}::jsonb`); allParams.push(JSON.stringify(val));
        } else {
          phs.push(`$${idx}`); allParams.push(val ?? null);
        }
        idx++;
      }
      valueSets.push(`(${phs.join(", ")})`);
    }

    const returning = this._returnSelect ? ` RETURNING ${buildColumnList(this._returnSelect)}` : "";
    const q = `INSERT INTO ${table} (${colNames}) VALUES ${valueSets.join(", ")}${returning}`;
    const result = await this._sql.unsafe(q, allParams);

    return this._wrapMutationResult(result);
  }

  // ── UPDATE execution ────────────────────────────────────────────────────

  private async _execUpdate(): Promise<QueryResult<T>> {
    if (!this._data) return { data: null, error: { message: "No data provided for update" } };

    const updates = this._data as Record<string, unknown>;
    const columns = Object.keys(updates);
    if (columns.length === 0) return { data: null, error: { message: "No columns to update" } };

    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const col of columns) {
      const val = updates[col];
      if (this._isJsonValue(val)) {
        sets.push(`${qi(col)} = $${idx}::jsonb`); params.push(JSON.stringify(val));
      } else {
        sets.push(`${qi(col)} = $${idx}`); params.push(val ?? null);
      }
      idx++;
    }

    const table = qi(this._table);
    const { sql: where, params: wp } = this._buildWhere(idx);
    params.push(...wp);

    const returning = this._returnSelect ? ` RETURNING ${buildColumnList(this._returnSelect)}` : "";
    const q = `UPDATE ${table} SET ${sets.join(", ")}${where}${returning}`;
    const result = await this._sql.unsafe(q, params);

    return this._wrapMutationResult(result);
  }

  // ── DELETE execution ────────────────────────────────────────────────────

  private async _execDelete(): Promise<QueryResult<T>> {
    const table = qi(this._table);
    const { sql: where, params } = this._buildWhere();
    const returning = this._returnSelect ? ` RETURNING ${buildColumnList(this._returnSelect)}` : "";
    const q = `DELETE FROM ${table}${where}${returning}`;
    const result = await this._sql.unsafe(q, params);

    return this._wrapMutationResult(result);
  }

  // ── UPSERT execution ───────────────────────────────────────────────────

  private async _execUpsert(): Promise<QueryResult<T>> {
    if (!this._data) return { data: null, error: { message: "No data provided for upsert" } };

    const rows = Array.isArray(this._data) ? this._data : [this._data];
    if (rows.length === 0) return { data: ([] as unknown) as T, error: null };

    const columns = Object.keys(rows[0]);
    const table = qi(this._table);
    const colNames = columns.map(qi).join(", ");
    const conflictTarget = this._upsertOptions.onConflict || "id";

    const allParams: unknown[] = [];
    const valueSets: string[] = [];
    let idx = 1;

    for (const row of rows) {
      const phs: string[] = [];
      for (const col of columns) {
        const val = row[col];
        if (this._isJsonValue(val)) {
          phs.push(`$${idx}::jsonb`); allParams.push(JSON.stringify(val));
        } else {
          phs.push(`$${idx}`); allParams.push(val ?? null);
        }
        idx++;
      }
      valueSets.push(`(${phs.join(", ")})`);
    }

    let onConflict: string;
    if (this._upsertOptions.ignoreDuplicates) {
      onConflict = ` ON CONFLICT (${conflictTarget}) DO NOTHING`;
    } else {
      const conflictCols = conflictTarget.split(",").map((s) => s.trim());
      const updateCols = columns
        .filter((c) => !conflictCols.includes(c))
        .map((c) => `${qi(c)} = EXCLUDED.${qi(c)}`)
        .join(", ");
      onConflict = updateCols
        ? ` ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateCols}`
        : ` ON CONFLICT (${conflictTarget}) DO NOTHING`;
    }

    const returning = this._returnSelect ? ` RETURNING ${buildColumnList(this._returnSelect)}` : "";
    const q = `INSERT INTO ${table} (${colNames}) VALUES ${valueSets.join(", ")}${onConflict}${returning}`;
    const result = await this._sql.unsafe(q, allParams);

    return this._wrapMutationResult(result);
  }

  // ── Result wrapping helpers ─────────────────────────────────────────────

  private _wrapRows(rows: Record<string, unknown>[], count: number | null): QueryResult<T> {
    if (this._single) {
      if (rows.length !== 1) {
        return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" }, count };
      }
      return { data: rows[0] as T, error: null, count };
    }

    if (this._maybeSingle) {
      if (rows.length > 1) {
        return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" }, count };
      }
      return { data: (rows[0] ?? null) as T, error: null, count };
    }

    return { data: rows as unknown as T, error: null, count };
  }

  private _wrapMutationResult(result: postgres.RowList<postgres.Row[]>): QueryResult<T> {
    if (this._single) {
      if (result.length === 0) {
        return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" } };
      }
      return { data: result[0] as T, error: null };
    }
    if (this._maybeSingle) {
      return { data: (result.length > 0 ? result[0] : null) as T, error: null };
    }
    if (!this._returnSelect) {
      return { data: null, error: null };
    }
    return { data: (Array.isArray(this._data) ? result : result[0]) as unknown as T, error: null };
  }

  private _isJsonValue(val: unknown): boolean {
    return val !== null && val !== undefined && typeof val === "object" && !(val instanceof Date) && !Array.isArray(val);
  }
}

// ─── Database Client ─────────────────────────────────────────────────────────

export class DatabaseClient {
  private _sql: postgres.Sql;

  constructor(sql: postgres.Sql) {
    this._sql = sql;
  }

  from<T = Record<string, unknown>>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(this._sql, table);
  }

  async rpc<T = unknown>(
    functionName: string,
    params?: Record<string, unknown>
  ): Promise<QueryResult<T>> {
    try {
      const entries = Object.entries(params || {});

      let q: string;
      const values: unknown[] = [];

      if (entries.length === 0) {
        q = `SELECT * FROM ${qi(functionName)}()`;
      } else {
        const args = entries.map(([name], i) => `${qi(name)} := $${i + 1}`).join(", ");
        q = `SELECT * FROM ${qi(functionName)}(${args})`;
        values.push(...entries.map(([, v]) => v));
      }

      const result = await this._sql.unsafe(q, values);

      // single-column results get unwrapped
      if (result.length > 0) {
        const cols = Object.keys(result[0] as Record<string, unknown>);
        if (cols.length === 1) {
          const key = cols[0];
          if (result.length === 1) {
            return { data: (result[0] as Record<string, unknown>)[key] as T, error: null };
          }
          return { data: result.map((r) => (r as Record<string, unknown>)[key]) as unknown as T, error: null };
        }
      }

      return { data: result as unknown as T, error: null };
    } catch (err) {
      return { data: null, error: wrapError(err) };
    }
  }

  /** Raw SQL access for complex queries that don't fit the builder pattern */
  get sql(): postgres.Sql {
    return this._sql;
  }
}
