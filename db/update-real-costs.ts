/**
 * One-time update: replace placeholder ingredient costs with the real
 * numbers from Ish's actual dough spreadsheet.
 *
 * Best-guess units:
 *   - Butter:        stick   (US: 4 sticks per lb)
 *   - Cookie Butter: oz      (1.75 lb jar ≈ 28 oz)
 *   - Eggs:          each    (5 dozen flat)
 *   - Espresso:      g       (99 g tin)
 *   - White Sugar:   oz      (4 lb / 64 oz bag)
 *   - Brown Sugar:   oz      (2 lb / 32 oz bag)
 *   - Flour:         oz      (5 lb / 80 oz bag)
 *   - Baking Soda:   oz      (1 lb / 16 oz box)
 *   - Vanilla:       tsp     (6 oz bottle × 6 tsp/oz = 36 tsp)
 *
 * All values are editable later in /admin/ingredients.
 *
 * Usage:
 *   npx tsx --env-file=.env.local db/update-real-costs.ts
 */
import { db, ingredients } from "./index";
import { eq } from "drizzle-orm";

type IngredientUpdate = {
  matchName: string;    // existing row to update (by name)
  newName?:  string;    // optionally rename it
  unit:      string;
  costPerUnit: string;
  notes:     string;
};

// Updates to existing rows
const UPDATES: IngredientUpdate[] = [
  {
    matchName:   "Unsalted butter",
    unit:        "stick",
    costPerUnit: "0.7650",
    notes:       "$3.06 per lb (4 sticks)",
  },
  {
    matchName:   "Eggs",
    unit:        "each",
    costPerUnit: "0.1188",
    notes:       "$7.13 per 5 dozen",
  },
  {
    matchName:   "Granulated sugar",
    newName:     "White sugar",
    unit:        "oz",
    costPerUnit: "0.0488",
    notes:       "$3.12 per 4 lb bag",
  },
  {
    matchName:   "Brown sugar",
    unit:        "oz",
    costPerUnit: "0.1169",
    notes:       "$3.74 per 2 lb bag",
  },
  {
    matchName:   "All-purpose flour",
    unit:        "oz",
    costPerUnit: "0.0294",
    notes:       "$2.35 per 5 lb bag",
  },
  {
    matchName:   "Baking soda",
    unit:        "oz",
    costPerUnit: "0.0575",
    notes:       "$0.92 per 1 lb box",
  },
  {
    matchName:   "Vanilla extract",
    unit:        "tsp",
    costPerUnit: "0.1094",
    notes:       "$3.94 per 6 oz bottle (36 tsp)",
  },
];

// Rows to add (don't exist yet)
const INSERTS = [
  {
    name:        "Cookie butter",
    unit:        "oz",
    costPerUnit: "0.1954",
    notes:       "$5.47 per 1.75 lb jar (28 oz)",
  },
  {
    name:        "Espresso powder",
    unit:        "g",
    costPerUnit: "0.0909",
    notes:       "$9.00 per 99 g tin",
  },
];

async function main() {
  console.log("🔄 Updating ingredient costs with real spreadsheet data…\n");

  // Read current state
  const existing = await db.select().from(ingredients);
  const byName: Record<string, typeof existing[number]> = {};
  for (const row of existing) byName[row.name] = row;

  // Updates
  let updated = 0, skipped = 0;
  for (const u of UPDATES) {
    const row = byName[u.matchName];
    if (!row) {
      console.log(`  ⚠️  Skipping "${u.matchName}" — not found in DB`);
      skipped++;
      continue;
    }
    await db
      .update(ingredients)
      .set({
        name:        u.newName ?? row.name,
        unit:        u.unit,
        costPerUnit: u.costPerUnit,
        notes:       u.notes,
      })
      .where(eq(ingredients.id, row.id));

    const renamed = u.newName && u.newName !== u.matchName ? ` → "${u.newName}"` : "";
    console.log(`  ✓ ${u.matchName}${renamed}: $${u.costPerUnit}/${u.unit}`);
    updated++;
  }

  // Inserts (skip if already exists by name)
  let inserted = 0;
  for (const ins of INSERTS) {
    if (byName[ins.name]) {
      console.log(`  ↪ ${ins.name} already exists — skipping insert`);
      continue;
    }
    await db.insert(ingredients).values(ins);
    console.log(`  + ${ins.name}: $${ins.costPerUnit}/${ins.unit}`);
    inserted++;
  }

  console.log(`\n✅ Done — ${updated} updated, ${inserted} inserted, ${skipped} skipped`);
  console.log(`   Edit any of these at /admin/ingredients`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
