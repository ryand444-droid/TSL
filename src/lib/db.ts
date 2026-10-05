import { integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  price: numeric("price", { mode: "number" }),
  currency: text("currency"),
  priceText: text("price_text"),
  site: text("site").notNull(),
  host: text("host").notNull(),
  category: text("category").notNull().default("other"),
  notes: text("notes"),
  fetchError: text("fetch_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// One row per observed price, so phase 2 can draw history from the day an item was saved.
export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  price: numeric("price", { mode: "number" }),
  priceText: text("price_text"),
  seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Listing = typeof listings.$inferSelect;

const SCHEMA = `
  create table if not exists listings (
    id serial primary key,
    url text not null unique,
    title text not null,
    image_url text,
    price numeric,
    currency text,
    price_text text,
    site text not null,
    host text not null,
    category text not null default 'other',
    notes text,
    fetch_error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  create table if not exists price_history (
    id serial primary key,
    listing_id integer not null references listings(id) on delete cascade,
    price numeric,
    price_text text,
    seen_at timestamptz not null default now()
  );
  create index if not exists price_history_listing on price_history (listing_id, seen_at);
`;

type Db = PostgresJsDatabase;

const globalForDb = globalThis as unknown as { tslDb?: Promise<Db> };

/** The hosted database link. POSTGRES_URL is the name Supabase's Vercel integration uses. */
export function databaseUrl(): string | null {
  const raw = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  return raw.replace(/^["']|["']$/g, "") || null;
}

/** A database connection problem, explained in plain words so it can be shown on the page. */
export class DbSetupError extends Error {
  constructor(
    message: string,
    readonly target: string | null,
  ) {
    super(message);
  }
}

/** Where the link points (user, address, port), without the password. */
function describeTarget(url: string): string | null {
  try {
    const u = new URL(url);
    return `${decodeURIComponent(u.username) || "(no user)"} @ ${u.hostname}:${u.port || "5432"}`;
  } catch {
    return null;
  }
}

export function explainDbError(err: unknown, url: string): DbSetupError {
  const e = err as { code?: string; message?: string };
  const msg = e?.message ?? String(err);
  const target = describeTarget(url);
  let text: string;
  if (!target) {
    text =
      "The saved DATABASE_URL isn't a valid link. If the password has symbols such as @ # / ? or %, reset it in Supabase to letters and numbers only and paste the link again.";
  } else if (url.includes("…") || /%E2%80%A6/i.test(url) || url.includes("[") || url.includes("]")) {
    text =
      "The saved DATABASE_URL still has placeholder text in it (\"…\" or square brackets). Copy the Transaction pooler link from Supabase's Connect button and put only your password where [YOUR-PASSWORD] was.";
  } else if (e?.code === "ENOTFOUND" || /getaddrinfo/.test(msg)) {
    text =
      "The database address couldn't be found. Use the Transaction pooler link from Supabase's Connect button (it ends in :6543/postgres), not the Direct connection one.";
  } else if (e?.code === "28P01" || /password authentication failed/i.test(msg)) {
    text =
      "Supabase rejected the password. Reset the database password in Supabase (letters and numbers only) and put the new one in the link.";
  } else if (/tenant or user not found/i.test(msg)) {
    text =
      "Supabase doesn't recognise the user name. In the Transaction pooler link the user looks like postgres.yourprojectid, not just postgres.";
  } else if (["ECONNREFUSED", "ETIMEDOUT", "ENETUNREACH", "CONNECT_TIMEOUT"].includes(e?.code ?? "")) {
    text = "The database didn't answer. Check the link is the Transaction pooler one, on port 6543.";
  } else {
    text = `The database connection failed: ${msg}`;
  }
  // Never show the password, even if a driver message happens to include the link.
  try {
    const password = new URL(url).password;
    if (password) text = text.split(password).join("****");
  } catch {}
  return new DbSetupError(text, target);
}

async function connect(): Promise<Db> {
  const url = databaseUrl();
  if (url) {
    // Hosted Postgres, e.g. Supabase. prepare:false keeps it working behind Supabase's pooler.
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    try {
      const client = postgres(url, { prepare: false, connect_timeout: 10 });
      await client.unsafe(SCHEMA);
      return drizzle(client);
    } catch (err) {
      console.error(err);
      throw explainDbError(err, url);
    }
  }
  // No DATABASE_URL: an embedded Postgres stored in .data/, for running locally with no accounts.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  await client.exec(SCHEMA);
  return drizzle(client) as unknown as Db;
}

export function getDb(): Promise<Db> {
  globalForDb.tslDb ??= connect().catch((err) => {
    globalForDb.tslDb = undefined;
    throw err;
  });
  return globalForDb.tslDb;
}
