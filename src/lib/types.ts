/** Core domain types for The Café Companion. */

export type DietTag =
  | "vegan"
  | "vegetarian"
  | "gluten-free"
  | "dairy-free"
  | "nut-free"
  | "contains-nuts"
  | "contains-dairy"
  | "contains-gluten";

export type Category = "coffee" | "tea" | "cold" | "pastry" | "breakfast" | "lunch" | "snack";

export type Occasion = "morning" | "afternoon" | "evening" | "work" | "meeting" | "unwind";

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  description: string;
  priceCents: number;
  currency: "INR" | "USD";
  tags: DietTag[];
  /** Minutes the kitchen/bar typically needs for one unit. */
  prepMinutes: number;
  /** Rough caffeine content in mg, 0 when none. */
  caffeineMg: number;
  /** 0-5 subjective sweetness. */
  sweetness: number;
  /** When this item shines. */
  bestFor: Occasion[];
  popular?: boolean;
}

export interface Preferences {
  dietary: DietTag[];
  dislikes: string[];
  favourites: string[];
  milk?: "dairy" | "oat" | "almond" | "soy" | "none";
  caffeine?: "any" | "low" | "none";
  budgetCents?: number;
  mood?: Occasion;
}

export interface CartLine {
  itemId: string;
  name: string;
  qty: number;
  notes?: string;
  unitPriceCents: number;
}

export type OrderStatus = "received" | "preparing" | "ready" | "collected" | "cancelled";

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  lines: CartLine[];
  totalCents: number;
  status: OrderStatus;
  /** Predicted minutes until ready, from the moment it was placed. */
  etaMinutes: number;
  channel: "chat" | "web";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface Feedback {
  id: string;
  createdAt: string;
  text: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  sentiment: Sentiment;
  /** -1..1 */
  score: number;
  topics: string[];
  urgent: boolean;
}

export type OpenTo = "chat" | "cowork" | "coffee-buddy" | "language-exchange";

export interface ConnectProfile {
  id: string;
  createdAt: string;
  displayName: string;
  interests: string[];
  openTo: OpenTo[];
  /** Free text, optional, e.g. "working on a startup pitch". */
  blurb?: string;
  expiresAt: string;
}

export interface Match {
  profile: ConnectProfile;
  sharedInterests: string[];
  icebreaker: string;
  score: number;
}

export type AiMode = "gemini" | "demo";

export interface WaitPrediction {
  queueLength: number;
  activeOrders: number;
  estimatedMinutes: number;
  confidence: "low" | "medium" | "high";
  bestTimeToVisit: string;
  explanation: string;
  mode: AiMode;
}

export interface RoomInsights {
  generatedAt: string;
  sampleSize: number;
  /** -1..1 */
  moodScore: number;
  moodLabel: "great" | "good" | "mixed" | "tense";
  topTopics: Array<{ topic: string; count: number; sentiment: number }>;
  urgentCount: number;
  suggestions: string[];
  mode: AiMode;
}

export interface Recommendation {
  item: MenuItem;
  reason: string;
  score: number;
}
