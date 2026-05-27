import { db, capitalExpenses, orders, orderItems, recipeIngredients, ingredients, packaging, cookies as cookiesTable } from "@/db";
import { desc } from "drizzle-orm";
import InvestmentClient from "./InvestmentClient";

export const dynamic = "force-dynamic";

export default async function InvestmentPage() {
  const expenses        = await db.select().from(capitalExpenses).orderBy(desc(capitalExpenses.purchasedAt));
  const allOrders       = await db.select().from(orders);
  const allItems        = await db.select().from(orderItems);
  const allRecipes      = await db.select().from(recipeIngredients);
  const allIngredients  = await db.select().from(ingredients);
  const allPackaging    = await db.select().from(packaging);
  const allCookies      = await db.select().from(cookiesTable);

  // Compute lifetime profit so we can show recoup
  // Per-cookie cost (ingredients only)
  const costPerCookie: Record<string, number> = {};
  for (const c of allCookies) {
    const recipe = allRecipes.filter((r) => r.cookieId === c.id);
    costPerCookie[c.slug] = recipe.reduce((sum, r) => {
      const ing = allIngredients.find((i) => i.id === r.ingredientId);
      if (!ing) return sum;
      return sum + Number(r.quantity) * Number(ing.costPerUnit);
    }, 0);
  }

  // Packaging cost per box size
  function packagingCostFor(boxSize: string): number {
    return allPackaging
      .filter((p) => p.sizeFor === boxSize || p.sizeFor === "all")
      .reduce((sum, p) => sum + (p.unitsPerBox ?? 1) * Number(p.costPerUnit), 0);
  }

  // Lifetime revenue & COGS from paid+ orders (not cancelled)
  const earnedOrders = allOrders.filter((o) => o.status && !["cancelled", "pending"].includes(o.status));
  let lifetimeRevenue = 0;
  let lifetimeCOGS    = 0;
  for (const o of earnedOrders) {
    lifetimeRevenue += Number(o.total);
    const items = allItems.filter((it) => it.orderId === o.id);
    for (const item of items) {
      lifetimeCOGS += (costPerCookie[item.cookieSlug] ?? 0) * item.quantity;
    }
    lifetimeCOGS += packagingCostFor(o.boxSize) * o.boxCount;
  }
  const lifetimeProfit = lifetimeRevenue - lifetimeCOGS;

  return (
    <InvestmentClient
      expenses={expenses}
      lifetimeProfit={lifetimeProfit}
      lifetimeRevenue={lifetimeRevenue}
      lifetimeCOGS={lifetimeCOGS}
    />
  );
}
