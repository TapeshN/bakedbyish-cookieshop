import { db, weeklyBatches, batchCookies, cookies as cookiesTable, recipeIngredients, ingredients, orders, orderItems } from "@/db";
import { desc, eq, ne, and } from "drizzle-orm";
import BatchClient from "./BatchClient";

export const dynamic = "force-dynamic";

export default async function BatchPage() {
  const batches    = await db.select().from(weeklyBatches).orderBy(desc(weeklyBatches.createdAt)).limit(10);
  const allCookies = await db.select().from(cookiesTable);
  const allItems   = await db.select().from(batchCookies);
  const allRecipes = await db.select().from(recipeIngredients);
  const allIngredients = await db.select().from(ingredients);

  // Sold per (batchId, cookieSlug) — joins orders→orderItems
  const soldRows = await db
    .select({
      batchId:    orders.batchId,
      cookieSlug: orderItems.cookieSlug,
      quantity:   orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(ne(orders.status, "cancelled"));

  // Flatten into { [`${batchId}:${slug}`]: total }
  const soldByBatchSlug: Record<string, number> = {};
  for (const r of soldRows) {
    if (r.batchId == null) continue;
    const key = `${r.batchId}:${r.cookieSlug}`;
    soldByBatchSlug[key] = (soldByBatchSlug[key] ?? 0) + r.quantity;
  }

  return (
    <BatchClient
      batches={batches}
      cookies={allCookies}
      batchItems={allItems}
      recipeIngredients={allRecipes}
      ingredients={allIngredients}
      soldByBatchSlug={soldByBatchSlug}
    />
  );
}
