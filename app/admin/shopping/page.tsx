import { db, ingredients, weeklyBatches, batchCookies, recipeIngredients } from "@/db";
import { asc, desc, inArray } from "drizzle-orm";
import ShoppingClient from "./ShoppingClient";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const ingRows = await db.select().from(ingredients).orderBy(asc(ingredients.name));

  // Pull active batches to compute needs for THIS week
  const activeBatches = await db
    .select()
    .from(weeklyBatches)
    .where(inArray(weeklyBatches.status, ["planning", "shopping", "baking"]))
    .orderBy(desc(weeklyBatches.weekOf))
    .limit(1);

  // Compute "need" per ingredient = sum across active batches of (planned × per-cookie)
  const need: Record<number, number> = {};
  if (activeBatches.length > 0) {
    const batchIds = activeBatches.map(b => b.id);
    const items = await db.select().from(batchCookies).where(inArray(batchCookies.batchId, batchIds));
    const recipes = await db.select().from(recipeIngredients);

    for (const item of items) {
      const planned = item.plannedQty;
      const recipe  = recipes.filter(r => r.cookieId === item.cookieId);
      for (const r of recipe) {
        need[r.ingredientId] = (need[r.ingredientId] ?? 0) + Number(r.quantity) * planned;
      }
    }
  }

  // Build rows with deficit calculation
  const rows = ingRows.map(i => {
    const haveQty   = Number(i.currentStock ?? 0);
    const needQty   = need[i.id] ?? 0;
    const deficit   = Math.max(0, needQty - haveQty);
    const threshold = Number(i.lowStockThreshold ?? 0);
    const low       = haveQty > 0 && threshold > 0 && haveQty <= threshold;
    const out       = haveQty <= 0;
    return {
      id:           i.id,
      name:         i.name,
      unit:         i.unit,
      costPerUnit:  i.costPerUnit,
      currentStock: String(haveQty),
      threshold,
      need: needQty,
      deficit,
      low,
      out,
    };
  });

  // Sort: out → low → has deficit → ok
  rows.sort((a, b) => {
    const score = (r: typeof a) => (r.out ? 0 : r.deficit > 0 ? 1 : r.low ? 2 : 3);
    return score(a) - score(b);
  });

  return <ShoppingClient rows={rows} activeBatchWeek={activeBatches[0]?.weekOf ?? null} />;
}
