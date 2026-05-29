export type Review = {
  name: string;
  quote: string;
  flavor: string;
  color: string;
};

export const REVIEWS: Review[] = [
  {
    name: "Maya R.",
    quote: "I have actually thought about these cookies during meetings. The white chocolate caramel one is dangerous.",
    flavor: "White Chocolate Caramel",
    color: "var(--caramel)",
  },
  {
    name: "Devon P.",
    quote: "Ordered a dozen for my mom's birthday. She texted me a photo of the empty box 4 hours later.",
    flavor: "Mixed dozen",
    color: "var(--terracotta)",
  },
  {
    name: "Sana K.",
    quote: "Dark chocolate, buttery toffee, and toasted pecans — I now bake nothing because she does it better.",
    flavor: "Dark Chocolate Toffee Nut",
    color: "var(--chocolate)",
  },
  {
    name: "Tomás L.",
    quote: "Picked up Saturday warm. Ate one in the car. Made it 3 blocks before turning around for another box.",
    flavor: "Cinnamon Espresso",
    color: "var(--terracotta)",
  },
];
