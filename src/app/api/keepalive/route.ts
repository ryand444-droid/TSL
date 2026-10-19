import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Called once a day by Vercel Cron (see vercel.json). Supabase pauses free projects after a week
 * with no database activity, which takes the whole app down until someone clicks Restore.
 */
export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
