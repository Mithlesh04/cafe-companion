import type { ConnectProfile, Feedback, Order } from "../types";
import type { Store } from "./types";

/**
 * In-memory store. Used for local dev, tests and the pilot when Firestore
 * is not configured. Data lives for the lifetime of the server process.
 */
export class MemoryStore implements Store {
  private orders = new Map<string, Order>();
  private feedback = new Map<string, Feedback>();
  private profiles = new Map<string, ConnectProfile>();

  async putOrder(order: Order) {
    this.orders.set(order.id, order);
    return order;
  }
  async getOrder(id: string) {
    return this.orders.get(id);
  }
  async listOrders(limit = 100) {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
  async putFeedback(f: Feedback) {
    this.feedback.set(f.id, f);
    return f;
  }
  async listFeedback(limit = 200) {
    return Array.from(this.feedback.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
  async putProfile(p: ConnectProfile) {
    this.profiles.set(p.id, p);
    return p;
  }
  async listProfiles() {
    const now = Date.now();
    for (const [id, p] of this.profiles) {
      if (Date.parse(p.expiresAt) < now) this.profiles.delete(id);
    }
    return Array.from(this.profiles.values());
  }
  async deleteProfile(id: string) {
    this.profiles.delete(id);
  }
  async clear() {
    this.orders.clear();
    this.feedback.clear();
    this.profiles.clear();
  }
}
