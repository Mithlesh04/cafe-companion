import type { ConnectProfile, Feedback, Order } from "../types";

/** Persistence boundary. Swap implementations without touching routes. */
export interface Store {
  putOrder(order: Order): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  listOrders(limit?: number): Promise<Order[]>;

  putFeedback(f: Feedback): Promise<Feedback>;
  listFeedback(limit?: number): Promise<Feedback[]>;

  putProfile(p: ConnectProfile): Promise<ConnectProfile>;
  listProfiles(): Promise<ConnectProfile[]>;
  deleteProfile(id: string): Promise<void>;

  /** Test/pilot reset. */
  clear(): Promise<void>;
}
