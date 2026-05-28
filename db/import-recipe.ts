/**
 * Import a single recipe from one of Ish's batch-cost sheets.
 *
 * Each sheet describes ONE cookie:
 *   - List of ingredients with "amount used" (per BATCH, not per cookie)
 *   - A batch size (e.g. 50 cookies)
 *   - A sale price
 *
 * This script:
 *   1. Inserts (or fetches) the cookie row
 *   2. Replaces its recipe_ingredients with the new mapping
 *   3. Divides per-batch amounts by batch size to store per-cookie qty
 *      (which is what /admin/recipes expects)
 *
 * Add a new recipe at the bottom of RECIPES and re-run:
 *   npx tsx --env-file=.env.local db/import-recipe.ts
 *
 * Re-running is idempotent — recipe rows for the cookie are wiped
 * and re-inserted, so edits in this file overwrite the DB.
 */
import { db, cookies, ingredients, recipeIngredients } from "./index";
import { eq } from "drizzle-orm";

type RecipeIngredient = {
  /**
   * Ingredient name as it appears in the `ingredients` table.
   * Must match exactly — run db/update-real-costs.ts first to ensure
   * the canonical names exist.
   */
  ingredient: string;
  /**
   * Amount used per BATCH (not per cookie). Must be in the same unit
   * the ingredient is priced in (check /admin/ingredients).
   *
   * e.g. butter is priced per stick → put sticks here
   *      vanilla is priced per tsp → put tsp here
   */
  amountPerBatch: number;
  /** Optional note shown in /admin/recipes */
  notes?: string;
};

type Recipe = {
  slug:        string;
  name:        string;
  blurb:       string;
  salePrice:   string;
  accent:      string;
  tags:        string[];
  photo?:      string;
  /** How many cookies one batch produces */
  batchSize:   number;
  ingredients: RecipeIngredient[];
};

// ── Recipes ──────────────────────────────────────────────────────────────
// Add a new entry here for each spreadsheet your sister sends over.
const RECIPES: Recipe[] = [
  {
    slug:      "espresso-cookie-butter",
    name:      "Espresso Cookie Butter",
    blurb:     "Brown-sugary dough with espresso warmth and a swirl of cookie butter.",
    salePrice: "4.00",
    accent:    "var(--chocolate)",
    tags:      ["new"],
    batchSize: 50,
    ingredients: [
      { ingredient: "Unsalted butter",   amountPerBatch: 2,      notes: "2 sticks per batch" },
      { ingredient: "Cookie butter",     amountPerBatch: 1,      notes: "1 oz per batch (0.0625 lb)" },
      { ingredient: "Eggs",              amountPerBatch: 2.5 },
      { ingredient: "Espresso powder",   amountPerBatch: 2.3 },
      { ingredient: "White sugar",       amountPerBatch: 2.35 },
      { ingredient: "Brown sugar",       amountPerBatch: 7.5 },
      { ingredient: "All-purpose flour", amountPerBatch: 8.5 },
      { ingredient: "Baking soda",       amountPerBatch: 0.17 },
      { ingredient: "Vanilla extract",   amountPerBatch: 12,     notes: "2 oz = 12 tsp" },
    ],
  },

  // ── Add new recipes below ────────────────────────────────────────────
  // Copy the block above, change slug/name/ingredients, save, rerun.
];

async function main() {
  console.log("🍳 Importing recipes…\n");

  // Cache existing ingredients by name
  const allIng = await db.select().from(ingredients);
  const ingByName: Record<string, typeof allIng[number]> = {};
  for (const i of allIng) ingByName[i.name.toLowerCase()] = i;

  for (const r of RECIPES) {
    console.log(`📋 ${r.name} (${r.slug})`);

    // 1. Upsert cookie row
    const existing = await db.select().from(cookies).where(eq(cookies.slug, r.slug)).limit(1);
    let cookieId: number;
    if (existing.length) {
      cookieId = existing[0].id;
      await db.update(cookies).set({
        name:      r.name,
        blurb:     r.blurb,
        salePrice: r.salePrice,
        accent:    r.accent,
        tags:      r.tags,
        photo:     r.photo ?? existing[0].photo,
      }).where(eq(cookies.id, cookieId));
      console.log(`   ↻ updated cookie row (id=${cookieId})`);
    } else {
      const [inserted] = await db.insert(cookies).values({
        slug:      r.slug,
        name:      r.name,
        blurb:     r.blurb,
        salePrice: r.salePrice,
        accent:    r.accent,
        tags:      r.tags,
        photo:     r.photo,
        active:    true,
      }).returning({ id: cookies.id });
      cookieId = inserted.id;
      console.log(`   + inserted cookie row (id=${cookieId})`);
    }

    // 2. Wipe existing recipe rows for this cookie
    const deleted = await db.delete(recipeIngredients).where(eq(recipeIngredients.cookieId, cookieId));
    console.log(`   🗑  cleared old recipe rows`);

    // 3. Insert each ingredient (per-cookie qty = perBatch / batchSize)
    let cogs = 0;
    for (const ri of r.ingredients) {
      const ing = ingByName[ri.ingredient.toLowerCase()];
      if (!ing) {
        console.log(`   ⚠️  Skipping "${ri.ingredient}" — not found in ingredients table`);
        continue;
      }
      const perCookie = ri.amountPerBatch / r.batchSize;
      await db.insert(recipeIngredients).values({
        cookieId,
        ingredientId: ing.id,
        quantity:     perCookie.toFixed(4),
        notes:        ri.notes ?? null,
      });
      const lineCost = perCookie * Number(ing.costPerUnit);
      cogs += lineCost;
      console.log(`   ✓ ${ing.name}: ${perCookie.toFixed(4)} ${ing.unit}/cookie ($${lineCost.toFixed(4)})`);
    }

    const margin = ((Number(r.salePrice) - cogs) / Number(r.salePrice)) * 100;
    console.log(`   💰 cost/cookie: $${cogs.toFixed(4)}  ·  margin: ${margin.toFixed(1)}%\n`);
  }

  console.log("✅ Done — see /admin/recipes to view & tweak");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
