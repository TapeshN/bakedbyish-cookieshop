/**
 * Import recipes from Ish's batch-cost sheet format.
 *
 * Each recipe describes ONE cookie. Add entries to RECIPES and re-run.
 * Re-running is idempotent (each cookie's recipe rows are wiped and
 * re-inserted from this file).
 *
 * Ingredients:
 *   - If `unit` and `costPerUnit` are supplied AND the ingredient doesn't
 *     exist by name, it's auto-created. Otherwise the existing row is used
 *     (you must run db/update-real-costs.ts first to ensure canonical names).
 *
 * Quantities:
 *   - `amountPerBatch` is in the ingredient's unit (oz, stick, tsp, etc.)
 *     Stored as quantity = amountPerBatch / batchSize.
 *
 * Usage:
 *   npx tsx --env-file=.env.local db/import-recipe.ts
 */
import { db, cookies, ingredients, recipeIngredients } from "./index";
import { eq } from "drizzle-orm";

type RecipeIngredient = {
  ingredient:      string;
  amountPerBatch:  number;
  unit?:           string;          // only needed for auto-create
  costPerUnit?:    string;          // only needed for auto-create
  notes?:          string;
};

type Recipe = {
  slug:        string;
  name:        string;
  blurb:       string;
  salePrice:   string;
  accent:      string;
  tags:        string[];
  photo?:      string;
  batchSize:   number;
  ingredients: RecipeIngredient[];
};

// ── Shared base: brown-butter espresso dough (for 50 cookies) ────────────
const BASE_DOUGH: RecipeIngredient[] = [
  { ingredient: "Unsalted butter",   amountPerBatch: 2,    notes: "browned, then cooled" },
  { ingredient: "Eggs",              amountPerBatch: 2.5 },
  { ingredient: "Espresso powder",   amountPerBatch: 2.3 },
  { ingredient: "White sugar",       amountPerBatch: 2.35 },
  { ingredient: "Brown sugar",       amountPerBatch: 7.5 },
  { ingredient: "All-purpose flour", amountPerBatch: 8.5 },
  { ingredient: "Baking soda",       amountPerBatch: 0.17 },
  { ingredient: "Vanilla extract",   amountPerBatch: 12,   notes: "2 oz = 12 tsp" },
];

// ── Recipes ──────────────────────────────────────────────────────────────
const RECIPES: Recipe[] = [
  {
    slug:      "brown-butter-biscoff",
    name:      "Brown Butter Biscoff",
    blurb:     "Brown-butter espresso dough loaded with white chocolate puddles and pockets of soft, chewy caramel.",
    salePrice: "4.00",
    accent:    "var(--caramel)",
    tags:      ["bestseller"],
    photo:     "/cookies/hero-stack.png",
    batchSize: 50,
    ingredients: [
      ...BASE_DOUGH,
      { ingredient: "Cookie butter",            amountPerBatch: 1,                                 notes: "Biscoff spread, ~1 oz" },
      { ingredient: "White chocolate chips",    amountPerBatch: 170, unit: "g", costPerUnit: "0.0200" },
      { ingredient: "Soft caramel chunks",      amountPerBatch: 100, unit: "g", costPerUnit: "0.0280", notes: "chopped soft caramel" },
    ],
  },
  {
    slug:      "dark-chocolate-toffee",
    name:      "Dark Chocolate Toffee",
    blurb:     "Brown-butter espresso dough with dark chocolate chunks and shards of homemade buttery toffee.",
    salePrice: "4.00",
    accent:    "var(--chocolate)",
    tags:      ["new"],
    photo:     "/cookies/oatmeal-plate.png",
    batchSize: 50,
    ingredients: [
      ...BASE_DOUGH,
      { ingredient: "Dark chocolate chips",     amountPerBatch: 170, unit: "g", costPerUnit: "0.0180" },
      { ingredient: "Toffee bits",              amountPerBatch: 100, unit: "g", costPerUnit: "0.0260", notes: "homemade toffee shards" },
    ],
  },
  {
    slug:      "cinnamon-espresso",
    name:      "Cinnamon Espresso",
    blurb:     "Soft, chewy brown-butter espresso cookie rolled in warm cinnamon sugar. Cozy and buttery.",
    salePrice: "4.00",
    accent:    "var(--terracotta)",
    tags:      ["fan favorite"],
    photo:     "/cookies/snickerdoodles.png",
    batchSize: 50,
    ingredients: [
      ...BASE_DOUGH,
      { ingredient: "Cinnamon",                 amountPerBatch: 14, unit: "g", costPerUnit: "0.0080", notes: "for the coating" },
      { ingredient: "White sugar",              amountPerBatch: 2,                                    notes: "extra, for cinnamon-sugar roll" },
    ],
  },
];

async function ensureIngredient(
  cache: Map<string, { id: number; unit: string; costPerUnit: string }>,
  ri: RecipeIngredient
): Promise<{ id: number; unit: string; costPerUnit: string } | null> {
  const key = ri.ingredient.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  // Auto-create if unit + cost provided
  if (ri.unit && ri.costPerUnit) {
    const [created] = await db
      .insert(ingredients)
      .values({
        name:        ri.ingredient,
        unit:        ri.unit,
        costPerUnit: ri.costPerUnit,
      })
      .returning({ id: ingredients.id, unit: ingredients.unit, costPerUnit: ingredients.costPerUnit });
    const row = { id: created.id, unit: created.unit, costPerUnit: String(created.costPerUnit) };
    cache.set(key, row);
    console.log(`     + auto-created ingredient "${ri.ingredient}" ($${ri.costPerUnit}/${ri.unit})`);
    return row;
  }

  return null;
}

async function main() {
  console.log("🍳 Importing recipes…\n");

  // Cache existing ingredients by name
  const allIng = await db.select().from(ingredients);
  const ingCache = new Map<string, { id: number; unit: string; costPerUnit: string }>();
  for (const i of allIng) {
    ingCache.set(i.name.toLowerCase(), { id: i.id, unit: i.unit, costPerUnit: String(i.costPerUnit) });
  }

  for (const r of RECIPES) {
    console.log(`📋 ${r.name} (${r.slug})`);

    // Upsert cookie row
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
        active:    true,
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

    // Wipe existing recipe rows for this cookie
    await db.delete(recipeIngredients).where(eq(recipeIngredients.cookieId, cookieId));

    // Aggregate duplicate ingredients (e.g. white sugar used in dough + coating)
    const aggregated = new Map<string, RecipeIngredient>();
    for (const ri of r.ingredients) {
      const key = ri.ingredient.toLowerCase();
      const existing = aggregated.get(key);
      if (existing) {
        existing.amountPerBatch += ri.amountPerBatch;
        if (ri.notes) existing.notes = existing.notes ? `${existing.notes}; ${ri.notes}` : ri.notes;
      } else {
        aggregated.set(key, { ...ri });
      }
    }

    let cogs = 0;
    for (const ri of aggregated.values()) {
      const ing = await ensureIngredient(ingCache, ri);
      if (!ing) {
        console.log(`   ⚠️  Skipping "${ri.ingredient}" — not in DB and no unit/cost provided`);
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
      console.log(`   ✓ ${ri.ingredient}: ${perCookie.toFixed(4)} ${ing.unit}/cookie ($${lineCost.toFixed(4)})`);
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
