import { db, ingredients } from "@/db";
import { asc } from "drizzle-orm";
import IngredientsClient from "./IngredientsClient";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const rows = await db.select().from(ingredients).orderBy(asc(ingredients.name));
  return <IngredientsClient rows={rows} />;
}
