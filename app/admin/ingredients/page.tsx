import { db, ingredients } from "@/db";
import { asc } from "drizzle-orm";
import IngredientsClient from "./IngredientsClient";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const raw = await db.select().from(ingredients).orderBy(asc(ingredients.name));
  // Serialize dates so they cross the server→client boundary cleanly
  const rows = raw.map(r => ({
    ...r,
    lastRestockedAt: r.lastRestockedAt ? r.lastRestockedAt.toISOString() : null,
  }));
  return <IngredientsClient rows={rows} />;
}
