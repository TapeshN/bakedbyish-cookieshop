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
    id: "brown-butter",
    name: "Brown Butter White Chip",
    blurb: "Brown-buttered dough with white chocolate puddles and pools of soft caramel.",
    price: 4,
    tags: ["bestseller"],
    accent: "var(--chocolate)",
    photo: "/cookies/hero-stack.png",
  },
  {
    id: "snickerdoodle",
    name: "Cinnamon Snickerdoodle",
    blurb: "Cracked top, soft middle, rolled in vanilla-cinnamon sugar.",
    price: 4,
    tags: ["classic"],
    accent: "var(--caramel)",
    photo: "/cookies/snickerdoodles.png",
  },
  {
    id: "oatmeal",
    name: "Coconut Oatmeal",
    blurb: "Chewy oat cookie kissed with toasted coconut and brown sugar.",
    price: 4,
    tags: ["fan favorite"],
    accent: "var(--caramel)",
    photo: "/cookies/oatmeal-plate.png",
  },
  {
    id: "tahini",
    name: "Tahini Dark Chocolate",
    blurb: "Toasted sesame + 70% dark chocolate puddles. Flaky salt finish.",
    price: 5,
    tags: ["new"],
    accent: "var(--ink)",
  },
  {
    id: "funfetti",
    name: "Birthday Funfetti",
    blurb: "Vanilla bean sugar cookie loaded with rainbow sprinkles.",
    price: 4,
    tags: [],
    accent: "var(--strawberry)",
  },
  {
    id: "smores",
    name: "Campfire S'mores",
    blurb: "Graham crust, milk chocolate, toasted marshmallow center.",
    price: 5,
    tags: ["seasonal"],
    accent: "var(--chocolate)",
  },
  {
    id: "lemon",
    name: "Lemon Poppyseed Glaze",
    blurb: "Bright Meyer lemon, poppyseed crunch, sugar-snow glaze.",
    price: 4,
    tags: [],
    accent: "var(--caramel)",
  },
  {
    id: "red-velvet",
    name: "Red Velvet White Chip",
    blurb: "Cocoa-kissed, cream-cheese drizzle, white chocolate chunks.",
    price: 5,
    tags: [],
    accent: "var(--strawberry)",
  },
];

export const BOX_SIZES = [
  { id: "half",   count: 6,  label: "Half Dozen",   price: 0,   hint: "Pick 1–3 flavors" },
  { id: "dozen",  count: 12, label: "Dozen",         price: -4,  hint: "Pick 2–4 flavors", popular: true },
  { id: "double", count: 24, label: "Double Dozen",  price: -12, hint: "Pick up to 6 flavors" },
] as const;

export type BoxId = "half" | "dozen" | "double";

export const DELIVERY_FEE = 6;
