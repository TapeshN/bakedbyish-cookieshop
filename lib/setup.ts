/**
 * One-shot data setup — runs every migration the same scripts in db/* do,
 * but callable from a route handler so it can fire on Vercel without
 * needing local terminal access.
 *
 * Idempotent. Safe to re-run.
 */
import { db, ingredients, cookies, recipeIngredients } from "@/db";
import { eq } from "drizzle-orm";
import { setStock } from "@/lib/stock";

export type SetupResult = {
  step: string;
  ok: boolean;
  detail: string;
};

// ── Step 1: real ingredient costs from Ish's dough sheet ─────────────────
const REAL_COSTS: Array<{
  matchName: string;
  newName?:  string;
  unit:      string;
  costPerUnit: string;
  notes:     string;
}> = [
  { matchName: "Unsalted butter",   unit: "stick", costPerUnit: "0.7650", notes: "$3.06 per lb (4 sticks)" },
  { matchName: "Eggs",              unit: "each",  costPerUnit: "0.1188", notes: "$7.13 per 5 dozen" },
  { matchName: "Granulated sugar",  newName: "White sugar",  unit: "oz", costPerUnit: "0.0488", notes: "$3.12 per 4 lb bag" },
  { matchName: "Brown sugar",       unit: "oz",    costPerUnit: "0.1169", notes: "$3.74 per 2 lb bag" },
  { matchName: "All-purpose flour", unit: "oz",    costPerUnit: "0.0294", notes: "$2.35 per 5 lb bag" },
  { matchName: "Baking soda",       unit: "oz",    costPerUnit: "0.0575", notes: "$0.92 per 1 lb box" },
  { matchName: "Vanilla extract",   unit: "tsp",   costPerUnit: "0.1094", notes: "$3.94 per 6 oz bottle (36 tsp)" },
];
const NEW_INGREDIENTS = [
  { name: "Cookie butter",       unit: "oz", costPerUnit: "0.1954", notes: "$5.47 per 1.75 lb jar (28 oz)" },
  { name: "Espresso powder",     unit: "g",  costPerUnit: "0.0909", notes: "$9.00 per 99 g tin" },
];

async function runRealCosts(): Promise<SetupResult> {
  const allIng = await db.select().from(ingredients);
  const byName: Record<string, typeof allIng[number]> = {};
  for (const r of allIng) byName[r.name] = r;

  let updated = 0, inserted = 0, skipped = 0;
  for (const u of REAL_COSTS) {
    const row = byName[u.matchName];
    if (!row) { skipped++; continue; }
    await db
      .update(ingredients)
      .set({
        name:        u.newName ?? row.name,
        unit:        u.unit,
        costPerUnit: u.costPerUnit,
        notes:       u.notes,
      })
      .where(eq(ingredients.id, row.id));
    updated++;
  }
  for (const ins of NEW_INGREDIENTS) {
    if (byName[ins.name]) continue;
    await db.insert(ingredients).values(ins);
    inserted++;
  }
  return {
    step: "Real ingredient costs",
    ok: true,
    detail: `${updated} updated, ${inserted} added, ${skipped} skipped`,
  };
}

// ── Step 2: migrate to 3 flavors ─────────────────────────────────────────
const NEW_MENU = [
  { slug: "brown-butter-biscoff", name: "Brown Butter Biscoff", blurb: "Brown-butter espresso dough loaded with white chocolate puddles and pockets of soft, chewy caramel.", salePrice: "4.00", tags: ["bestseller"], accent: "var(--caramel)", photo: "/cookies/hero-stack.png" },
  { slug: "dark-chocolate-toffee", name: "Dark Chocolate Toffee", blurb: "Brown-butter espresso dough with dark chocolate chunks and shards of homemade buttery toffee.", salePrice: "4.00", tags: ["new"], accent: "var(--chocolate)", photo: "/cookies/oatmeal-plate.png" },
  { slug: "cinnamon-espresso", name: "Cinnamon Espresso", blurb: "Soft, chewy brown-butter espresso cookie rolled in warm cinnamon sugar. Cozy and buttery.", salePrice: "4.00", tags: ["fan favorite"], accent: "var(--terracotta)", photo: "/cookies/snickerdoodles.png" },
];

async function runMenuMigration(): Promise<SetupResult> {
  const keepSlugs = new Set(NEW_MENU.map(c => c.slug));
  const existing = await db.select().from(cookies);

  let deactivated = 0, added = 0, updated = 0;
  for (const row of existing) {
    if (!keepSlugs.has(row.slug) && row.active) {
      await db.update(cookies).set({ active: false }).where(eq(cookies.id, row.id));
      deactivated++;
    }
  }
  for (const c of NEW_MENU) {
    const found = existing.find(row => row.slug === c.slug);
    if (found) {
      await db.update(cookies).set({ ...c, active: true }).where(eq(cookies.id, found.id));
      updated++;
    } else {
      await db.insert(cookies).values({ ...c, active: true });
      added++;
    }
  }
  return {
    step: "Menu → 3 signature flavors",
    ok: true,
    detail: `${deactivated} deactivated, ${added} added, ${updated} updated`,
  };
}

// ── Step 3: import recipes ───────────────────────────────────────────────
type RecipeIngredient = {
  ingredient: string;
  amountPerBatch: number;
  unit?: string;
  costPerUnit?: string;
  notes?: string;
};

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

const RECIPES = [
  {
    slug: "brown-butter-biscoff",
    batchSize: 50,
    ingredients: [
      ...BASE_DOUGH,
      { ingredient: "Cookie butter",         amountPerBatch: 1,                                  notes: "Biscoff spread, ~1 oz" },
      { ingredient: "White chocolate chips", amountPerBatch: 170, unit: "g", costPerUnit: "0.0200" },
      { ingredient: "Soft caramel chunks",   amountPerBatch: 100, unit: "g", costPerUnit: "0.0280", notes: "chopped soft caramel" },
    ],
  },
  {
    slug: "dark-chocolate-toffee",
    batchSize: 50,
    ingredients: [
      ...BASE_DOUGH,
      { ingredient: "Dark chocolate chips",  amountPerBatch: 170, unit: "g", costPerUnit: "0.0180" },
      { ingredient: "Toffee bits",           amountPerBatch: 100, unit: "g", costPerUnit: "0.0260", notes: "homemade toffee shards" },
    ],
  },
  {
    slug: "cinnamon-espresso",
    batchSize: 50,
    ingredients: [
      ...BASE_DOUGH,
      { ingredient: "Cinnamon",              amountPerBatch: 14, unit: "g", costPerUnit: "0.0080", notes: "for the coating" },
      { ingredient: "White sugar",           amountPerBatch: 2,                                    notes: "extra, for cinnamon-sugar roll" },
    ],
  },
];

async function runRecipeImport(): Promise<SetupResult> {
  const allIng = await db.select().from(ingredients);
  const ingCache = new Map<string, { id: number; unit: string; costPerUnit: string }>();
  for (const i of allIng) {
    ingCache.set(i.name.toLowerCase(), { id: i.id, unit: i.unit, costPerUnit: String(i.costPerUnit) });
  }

  let recipes = 0, autoCreated = 0;
  for (const r of RECIPES) {
    const [cookie] = await db.select().from(cookies).where(eq(cookies.slug, r.slug)).limit(1);
    if (!cookie) continue;

    await db.delete(recipeIngredients).where(eq(recipeIngredients.cookieId, cookie.id));

    // Aggregate duplicates (e.g. white sugar in dough + coating)
    const agg = new Map<string, RecipeIngredient>();
    for (const ri of r.ingredients) {
      const k = ri.ingredient.toLowerCase();
      const e = agg.get(k);
      if (e) {
        e.amountPerBatch += ri.amountPerBatch;
        if (ri.notes) e.notes = e.notes ? `${e.notes}; ${ri.notes}` : ri.notes;
      } else agg.set(k, { ...ri });
    }

    for (const ri of agg.values()) {
      let ing = ingCache.get(ri.ingredient.toLowerCase());
      if (!ing && ri.unit && ri.costPerUnit) {
        const [created] = await db.insert(ingredients).values({
          name: ri.ingredient, unit: ri.unit, costPerUnit: ri.costPerUnit,
        }).returning({ id: ingredients.id, unit: ingredients.unit, costPerUnit: ingredients.costPerUnit });
        ing = { id: created.id, unit: created.unit, costPerUnit: String(created.costPerUnit) };
        ingCache.set(ri.ingredient.toLowerCase(), ing);
        autoCreated++;
      }
      if (!ing) continue;
      await db.insert(recipeIngredients).values({
        cookieId:     cookie.id,
        ingredientId: ing.id,
        quantity:     (ri.amountPerBatch / r.batchSize).toFixed(4),
        notes:        ri.notes ?? null,
      });
    }
    recipes++;
  }
  return {
    step: "Recipe import (3 flavors)",
    ok: true,
    detail: `${recipes} recipes wired${autoCreated > 0 ? `, ${autoCreated} new ingredients auto-created` : ""}`,
  };
}

// ── Step 4: starter pantry stock + thresholds ────────────────────────────
const STARTERS = [
  { match: "Unsalted butter",       stock: 16,  threshold: 4,   note: "4 lb (16 sticks)" },
  { match: "Eggs",                  stock: 24,  threshold: 6,   note: "2 dozen" },
  { match: "Espresso powder",       stock: 99,  threshold: 10,  note: "1 full tin" },
  { match: "White sugar",           stock: 64,  threshold: 6,   note: "4 lb bag" },
  { match: "Brown sugar",           stock: 64,  threshold: 10,  note: "4 lb (2 bags)" },
  { match: "All-purpose flour",     stock: 160, threshold: 12,  note: "10 lb (2 bags)" },
  { match: "Baking soda",           stock: 16,  threshold: 1,   note: "1 box" },
  { match: "Vanilla extract",       stock: 36,  threshold: 14,  note: "6 oz bottle" },
  { match: "Cookie butter",         stock: 28,  threshold: 2,   note: "1 jar (1.75 lb)" },
  { match: "White chocolate chips", stock: 680, threshold: 200, note: "~1.5 lb" },
  { match: "Soft caramel chunks",   stock: 400, threshold: 120, note: "~14 oz" },
  { match: "Dark chocolate chips",  stock: 680, threshold: 200, note: "~1.5 lb" },
  { match: "Toffee bits",           stock: 400, threshold: 120, note: "~14 oz" },
  { match: "Cinnamon",              stock: 56,  threshold: 16,  note: "2 jars" },
];

async function runStarterStock(): Promise<SetupResult> {
  const allIng = await db.select().from(ingredients);
  const byName = new Map<string, typeof allIng[number]>();
  for (const i of allIng) byName.set(i.name.toLowerCase(), i);

  let stockSet = 0, stockKept = 0, missing = 0;
  for (const s of STARTERS) {
    const ing = byName.get(s.match.toLowerCase());
    if (!ing) { missing++; continue; }

    const current = Number(ing.currentStock ?? 0);
    if (current === 0) {
      await setStock({ ingredientId: ing.id, value: s.stock, reason: "initial", notes: s.note });
      stockSet++;
    } else {
      stockKept++;
    }
    await db
      .update(ingredients)
      .set({ lowStockThreshold: String(s.threshold) })
      .where(eq(ingredients.id, ing.id));
  }
  return {
    step: "Starter pantry stock",
    ok: true,
    detail: `${stockSet} stocked, ${stockKept} kept as-is${missing > 0 ? `, ${missing} missing` : ""}`,
  };
}

/**
 * Run every setup step in order. Returns a list of per-step results.
 * Each step is idempotent — safe to re-run.
 */
export async function runFullSetup(): Promise<SetupResult[]> {
  const results: SetupResult[] = [];

  for (const step of [runRealCosts, runMenuMigration, runRecipeImport, runStarterStock]) {
    try {
      results.push(await step());
    } catch (err) {
      results.push({
        step: step.name.replace(/^run/, ""),
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}
