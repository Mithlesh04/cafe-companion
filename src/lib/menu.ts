import type { MenuItem } from "./types";

/** Seed menu. In production this comes from the POS or Firestore. */
export const MENU: MenuItem[] = [
  { id: "espresso", name: "Espresso", category: "coffee", description: "Double shot, chocolatey and bright.", priceCents: 18000, currency: "INR", tags: ["vegan", "gluten-free", "dairy-free", "nut-free"], prepMinutes: 2, caffeineMg: 120, sweetness: 0, bestFor: ["morning", "work"], popular: true },
  { id: "flat-white", name: "Flat White", category: "coffee", description: "Velvety micro-foam over a double ristretto.", priceCents: 26000, currency: "INR", tags: ["vegetarian", "gluten-free", "contains-dairy", "nut-free"], prepMinutes: 4, caffeineMg: 130, sweetness: 1, bestFor: ["morning", "work", "meeting"], popular: true },
  { id: "oat-latte", name: "Oat Latte", category: "coffee", description: "Creamy oat milk latte, naturally sweet.", priceCents: 29000, currency: "INR", tags: ["vegan", "dairy-free", "nut-free", "contains-gluten"], prepMinutes: 4, caffeineMg: 130, sweetness: 2, bestFor: ["morning", "afternoon", "work"], popular: true },
  { id: "cappuccino", name: "Cappuccino", category: "coffee", description: "Classic thirds: espresso, steamed milk, foam.", priceCents: 24000, currency: "INR", tags: ["vegetarian", "gluten-free", "contains-dairy", "nut-free"], prepMinutes: 4, caffeineMg: 130, sweetness: 1, bestFor: ["morning", "meeting"] },
  { id: "filter-coffee", name: "South Indian Filter Coffee", category: "coffee", description: "Strong decoction with frothy hot milk.", priceCents: 15000, currency: "INR", tags: ["vegetarian", "gluten-free", "contains-dairy", "nut-free"], prepMinutes: 3, caffeineMg: 90, sweetness: 3, bestFor: ["morning", "afternoon"], popular: true },
  { id: "decaf-latte", name: "Decaf Latte", category: "coffee", description: "All the comfort, none of the jitters.", priceCents: 26000, currency: "INR", tags: ["vegetarian", "gluten-free", "contains-dairy", "nut-free"], prepMinutes: 4, caffeineMg: 5, sweetness: 1, bestFor: ["evening", "unwind"] },
  { id: "masala-chai", name: "Masala Chai", category: "tea", description: "Slow-brewed with ginger, cardamom and clove.", priceCents: 14000, currency: "INR", tags: ["vegetarian", "gluten-free", "contains-dairy", "nut-free"], prepMinutes: 5, caffeineMg: 40, sweetness: 3, bestFor: ["afternoon", "evening", "unwind"], popular: true },
  { id: "chamomile", name: "Chamomile Tea", category: "tea", description: "Caffeine-free, calming floral infusion.", priceCents: 16000, currency: "INR", tags: ["vegan", "gluten-free", "dairy-free", "nut-free"], prepMinutes: 4, caffeineMg: 0, sweetness: 1, bestFor: ["evening", "unwind"] },
  { id: "matcha-latte", name: "Matcha Latte", category: "tea", description: "Ceremonial grade matcha, whisked to order.", priceCents: 30000, currency: "INR", tags: ["vegetarian", "gluten-free", "contains-dairy", "nut-free"], prepMinutes: 5, caffeineMg: 70, sweetness: 2, bestFor: ["afternoon", "work"] },
  { id: "cold-brew", name: "Cold Brew", category: "cold", description: "18-hour steep, smooth and strong.", priceCents: 28000, currency: "INR", tags: ["vegan", "gluten-free", "dairy-free", "nut-free"], prepMinutes: 1, caffeineMg: 200, sweetness: 0, bestFor: ["afternoon", "work"], popular: true },
  { id: "iced-mocha", name: "Iced Mocha", category: "cold", description: "Espresso, dark chocolate, cold milk, ice.", priceCents: 32000, currency: "INR", tags: ["vegetarian", "gluten-free", "contains-dairy", "nut-free"], prepMinutes: 4, caffeineMg: 130, sweetness: 4, bestFor: ["afternoon", "unwind"] },
  { id: "lemonade", name: "Mint Lemonade", category: "cold", description: "Fresh lime, mint, a touch of honey.", priceCents: 18000, currency: "INR", tags: ["vegetarian", "gluten-free", "dairy-free", "nut-free"], prepMinutes: 2, caffeineMg: 0, sweetness: 3, bestFor: ["afternoon", "unwind"] },
  { id: "croissant", name: "Butter Croissant", category: "pastry", description: "Laminated, flaky, baked each morning.", priceCents: 16000, currency: "INR", tags: ["vegetarian", "contains-dairy", "contains-gluten", "nut-free"], prepMinutes: 1, caffeineMg: 0, sweetness: 2, bestFor: ["morning"], popular: true },
  { id: "almond-croissant", name: "Almond Croissant", category: "pastry", description: "Twice-baked with frangipane.", priceCents: 22000, currency: "INR", tags: ["vegetarian", "contains-dairy", "contains-gluten", "contains-nuts"], prepMinutes: 1, caffeineMg: 0, sweetness: 4, bestFor: ["morning", "afternoon"] },
  { id: "banana-bread", name: "Vegan Banana Bread", category: "pastry", description: "Moist, nut-free, lightly spiced.", priceCents: 18000, currency: "INR", tags: ["vegan", "dairy-free", "nut-free", "contains-gluten"], prepMinutes: 1, caffeineMg: 0, sweetness: 4, bestFor: ["afternoon", "unwind"] },
  { id: "gf-brownie", name: "Gluten-Free Brownie", category: "pastry", description: "Fudgy, 70% dark chocolate.", priceCents: 20000, currency: "INR", tags: ["vegetarian", "gluten-free", "contains-dairy", "nut-free"], prepMinutes: 1, caffeineMg: 15, sweetness: 5, bestFor: ["afternoon", "unwind"] },
  { id: "avocado-toast", name: "Avocado Toast", category: "breakfast", description: "Sourdough, smashed avocado, chilli, lime.", priceCents: 32000, currency: "INR", tags: ["vegan", "dairy-free", "nut-free", "contains-gluten"], prepMinutes: 8, caffeineMg: 0, sweetness: 0, bestFor: ["morning", "meeting"], popular: true },
  { id: "egg-bhurji", name: "Egg Bhurji Toast", category: "breakfast", description: "Spiced scrambled eggs on sourdough.", priceCents: 30000, currency: "INR", tags: ["vegetarian", "contains-gluten", "nut-free", "dairy-free"], prepMinutes: 9, caffeineMg: 0, sweetness: 0, bestFor: ["morning"] },
  { id: "paneer-wrap", name: "Paneer Tikka Wrap", category: "lunch", description: "Charred paneer, mint chutney, pickled onion.", priceCents: 34000, currency: "INR", tags: ["vegetarian", "contains-dairy", "contains-gluten", "nut-free"], prepMinutes: 10, caffeineMg: 0, sweetness: 0, bestFor: ["afternoon", "meeting"], popular: true },
  { id: "quinoa-bowl", name: "Quinoa Buddha Bowl", category: "lunch", description: "Roast veg, chickpeas, tahini dressing.", priceCents: 38000, currency: "INR", tags: ["vegan", "gluten-free", "dairy-free", "nut-free"], prepMinutes: 7, caffeineMg: 0, sweetness: 0, bestFor: ["afternoon", "work"] },
  { id: "tomato-soup", name: "Roast Tomato Soup", category: "lunch", description: "With a slice of grilled sourdough.", priceCents: 24000, currency: "INR", tags: ["vegan", "dairy-free", "nut-free", "contains-gluten"], prepMinutes: 6, caffeineMg: 0, sweetness: 1, bestFor: ["afternoon", "evening", "unwind"] },
  { id: "trail-mix", name: "House Trail Mix", category: "snack", description: "Almonds, cashews, dried cranberries.", priceCents: 12000, currency: "INR", tags: ["vegan", "gluten-free", "dairy-free", "contains-nuts"], prepMinutes: 0, caffeineMg: 0, sweetness: 2, bestFor: ["work", "afternoon"] },
];

export const MENU_BY_ID: Record<string, MenuItem> = Object.fromEntries(MENU.map((m) => [m.id, m]));

/** Fuzzy-ish lookup by id or name. Returns undefined for empty input. */
export function findMenuItem(query: string): MenuItem | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return (
    MENU_BY_ID[q] ??
    MENU.find((m) => m.name.toLowerCase() === q) ??
    MENU.find((m) => m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase()))
  );
}

export function formatPrice(cents: number, currency: MenuItem["currency"] = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

/** Compact text version of the menu for prompts. */
export function menuForPrompt(): string {
  return MENU.map(
    (m) => `- ${m.id} | ${m.name} | ${m.category} | ${formatPrice(m.priceCents)} | ${m.tags.join(",")} | caffeine ${m.caffeineMg}mg | ${m.description}`,
  ).join("\n");
}
