export type Cookie = {
  id: string;
  name: string;
  blurb: string;
  price: number;
  tags: string[];
  accent: string;
  photo?: string;
};

export const COOKIES: Cookie[] = [
  {
    id:     "brown-butter-biscoff",
    name:   "Brown Butter Biscoff",
    blurb:  "Brown-butter espresso dough loaded with white chocolate puddles and pockets of soft, chewy caramel.",
    price:  4,
    tags:   ["bestseller"],
    accent: "var(--caramel)",
    photo:  "/cookies/hero-stack.png",
  },
  {
    id:     "dark-chocolate-toffee",
    name:   "Dark Chocolate Toffee",
    blurb:  "Brown-butter espresso dough with dark chocolate chunks and shards of homemade buttery toffee.",
    price:  4,
    tags:   ["new"],
    accent: "var(--chocolate)",
    photo:  "/cookies/oatmeal-plate.png",
  },
  {
    id:     "cinnamon-espresso",
    name:   "Cinnamon Espresso",
    blurb:  "Soft, chewy brown-butter espresso cookie rolled in warm cinnamon sugar. Cozy and buttery.",
    price:  4,
    tags:   ["fan favorite"],
    accent: "var(--terracotta)",
    photo:  "/cookies/snickerdoodles.png",
  },
];

export const BOX_SIZES = [
  { id: "half",   count: 6,  label: "Half Dozen",   price: 0,   hint: "Pick 1–3 flavors" },
  { id: "dozen",  count: 12, label: "Dozen",         price: -4,  hint: "Pick 2–3 flavors", popular: true },
  { id: "double", count: 24, label: "Double Dozen",  price: -12, hint: "Pick up to 3 flavors" },
] as const;

export type BoxId = "half" | "dozen" | "double";

export const DELIVERY_FEE = 6;
