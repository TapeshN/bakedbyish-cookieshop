import { db, weeklyBatches, batchCookies, cookies as cookiesTable, recipeIngredients, ingredients } from "@/db";
import { desc, eq } from "drizzle-orm";
import BatchClient from "./BatchClient";

export const dynamic = "force-dynamic";

export default async function BatchPage() {
  const batches    = await db.select().from(weeklyBatches).orderBy(desc(weeklyBatches.createdAt)).limit(10);
  const allCookies = await db.select().from(cookiesTable);
  const allItems   = await db.select().from(batchCookies);
  const allRecipes = await db.select().from(recipeIngredients);
  const allIngredients = await db.select().from(ingredients);

  return (
    <BatchClient
      batches={batches}
      cookies={allCookies}
      batchItems={allItems}
      recipeIngredients={allRecipes}
      ingredients={allIngredients}
    />
  );
}
