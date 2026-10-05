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

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    // Hosted Postgres, e.g. Supabase. prepare:false keeps it working behind Supabase's pooler.
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, { prepare: false });
    await client.unsafe(SCHEMA);
    return drizzle(client);
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
