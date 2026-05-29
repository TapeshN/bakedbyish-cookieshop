/**
 * Seed opening-pantry stock + low-stock thresholds for every ingredient
 * used by the 3 active recipes.
 *
 * Assumptions:
 *   - One batch ≈ 50 cookies
 *   - Opening stock = enough for ~3 batches of any single flavor
 *   - Low threshold ≈ 1 batch reserve (alerts before you can't bake)
 *
 * Idempotent:
 *   - Skips ingredients that already have stock > 0 (won't overwrite
 *     a real restock log)
 *   - Always updates lowStockThreshold (refresh-safe)
 *   - Logs as `initial` transaction reason so the audit trail is clean
 *
 * Usage:
 *   npx tsx --env-file=.env db/seed-starter-stock.ts
 */
import { db, ingredients } from "./index";
import { eq } from "drizzle-orm";
import { setStock } from "../lib/stock";

type StarterStock = {
  match:     string;        // ingredient name (case-insensitive)
  stock:     number;        // opening quantity in the ingredient's unit
  threshold: number;        // low-stock alert threshold
  note:      string;        // human-readable rationale
};

const STARTERS: StarterStock[] = [
  // ── Base dough ────────────────────────────────────────────────────────
  { match: "Unsalted butter",     stock: 16,  threshold: 4,   note: "4 lb (16 sticks) — ~8 batches" },
  { match: "Eggs",                stock: 24,  threshold: 6,   note: "2 dozen — ~9 batches" },
  { match: "Espresso powder",     stock: 99,  threshold: 10,  note: "1 full tin — ~40 batches" },
  { match: "White sugar",         stock: 64,  threshold: 6,   note: "4 lb bag — ~14 batches" },
  { match: "Brown sugar",         stock: 64,  threshold: 10,  note: "4 lb (2 bags) — ~8 batches" },
  { match: "All-purpose flour",   stock: 160, threshold: 12,  note: "10 lb (2 bags) — ~18 batches" },
  { match: "Baking soda",         stock: 16,  threshold: 1,   note: "1 box (1 lb) — ~90 batches" },
  { match: "Vanilla extract",     stock: 36,  threshold: 14,  note: "6 oz bottle (36 tsp) — ~3 batches" },

  // ── Biscoff mix-ins ───────────────────────────────────────────────────
  { match: "Cookie butter",       stock: 28,  threshold: 2,   note: "1 jar (1.75 lb / 28 oz) — ~28 batches" },
  { match: "White chocolate chips", stock: 680, threshold: 200, note: "~1.5 lb — ~4 batches" },
  { match: "Soft caramel chunks", stock: 400, threshold: 120, note: "~14 oz — ~4 batches" },

  // ── Dark Chocolate Toffee mix-ins ─────────────────────────────────────
  { match: "Dark chocolate chips", stock: 680, threshold: 200, note: "~1.5 lb — ~4 batches" },
  { match: "Toffee bits",         stock: 400, threshold: 120, note: "~14 oz — ~4 batches" },

  // ── Cinnamon Espresso roll ───────────────────────────────────────────
  { match: "Cinnamon",            stock: 56,  threshold: 16,  note: "2 jars (~28 g each) — ~4 batches" },
];

async function main() {
  console.log("📦 Seeding opening pantry stock + thresholds…\n");

  const allIng = await db.select().from(ingredients);
  const byName = new Map<string, typeof allIng[number]>();
  for (const i of allIng) byName.set(i.name.toLowerCase(), i);

  let stockSet = 0, stockSkipped = 0, thresholdsSet = 0;

  for (const s of STARTERS) {
    const ing = byName.get(s.match.toLowerCase());
    if (!ing) {
      console.log(`  ⚠️  Skipping "${s.match}" — not in DB (run import-recipe.ts first?)`);
      continue;
    }

    const currentStock = Number(ing.currentStock ?? 0);

    // Set stock only if currently empty (don't overwrite real restocks)
    if (currentStock === 0) {
      await setStock({
        ingredientId: ing.id,
        value:        s.stock,
        reason:       "initial",
        notes:        s.note,
      });
      console.log(`  ✓ ${ing.name}: stock = ${s.stock} ${ing.unit}`);
      stockSet++;
    } else {
      console.log(`  ↪ ${ing.name}: already has ${currentStock} ${ing.unit} — keeping`);
      stockSkipped++;
    }

    // Always refresh the threshold
    await db
      .update(ingredients)
      .set({ lowStockThreshold: String(s.threshold) })
      .where(eq(ingredients.id, ing.id));
    thresholdsSet++;
  }

  console.log(`\n✅ Done — ${stockSet} stocked, ${stockSkipped} kept as-is, ${thresholdsSet} thresholds set`);
  console.log(`   See /admin/ingredients for the full picture`);
  console.log(`   /admin/insights will start showing burn-rate alerts after your first completed batch`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
