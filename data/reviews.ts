export type Review = {
  name: string;
  quote: string;
  flavor: string;
  color: string;
};

export const REVIEWS: Review[] = [
  {
    name: "Maya R.",
    quote: "I have actually thought about these cookies during meetings. The brown butter ones are dangerous.",
    flavor: "Brown Butter White Chip",
    color: "var(--chocolate)",
  },
  {
    name: "Devon P.",
    quote: "Ordered a dozen for my mom's birthday. She texted me a photo of the empty box 4 hours later.",
    flavor: "Mixed dozen",
    color: "var(--terracotta)",
  },
  {
    name: "Sana K.",
    quote: "The tahini one ruined me for every other cookie. Salt + sesame + chocolate is a personality trait now.",
    flavor: "Tahini Dark Chocolate",
    color: "var(--caramel)",
  },
  {
    name: "Tomás L.",
    quote: "Picked up Saturday warm. Ate one in the car. Made it 3 blocks before turning around for another box.",
    flavor: "Funfetti",
    color: "var(--strawberry)",
  },
];
