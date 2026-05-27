import { db, cookies as cookiesTable, ingredients, recipeIngredients } from "@/db";
import { asc, eq } from "drizzle-orm";
import RecipesClient from "./RecipesClient";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const allCookies     = await db.select().from(cookiesTable).orderBy(asc(cookiesTable.name));
  const allIngredients = await db.select().from(ingredients).orderBy(asc(ingredients.name));
  const allRecipes     = await db.select().from(recipeIngredients);

  return (
    <RecipesClient
      cookies={allCookies}
      ingredients={allIngredients}
      recipeIngredients={allRecipes}
    />
  );
}
