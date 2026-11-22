import { Firestore } from "@google-cloud/firestore";
import type { ConnectProfile, Feedback, Order } from "../types";
import type { Store } from "./types";

/**
 * Firestore-backed store (Google Cloud). Uses Application Default Credentials,
 * so on Cloud Run it needs no key file. Collections are prefixed so one project
 * can host several cafés or a pilot and production side by side.
 */
export class FirestoreStore implements Store {
  private db: Firestore;
  private prefix: string;

  constructor(projectId?: string, prefix = "cafe") {
    this.db = new Firestore(projectId ? { projectId } : undefined);
    this.prefix = prefix;
  }

  private col(name: string) {
    return this.db.collection(`${this.prefix}_${name}`);
  }

  async putOrder(order: Order) {
    await this.col("orders").doc(order.id).set(order);
    return order;
  }
  async getOrder(id: string) {
    const snap = await this.col("orders").doc(id).get();
    return snap.exists ? (snap.data() as Order) : undefined;
  }
  async listOrders(limit = 100) {
    const snap = await this.col("orders").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => d.data() as Order);
  }
  async putFeedback(f: Feedback) {
    await this.col("feedback").doc(f.id).set(f);
    return f;
  }
  async listFeedback(limit = 200) {
    const snap = await this.col("feedback").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => d.data() as Feedback);
  }
  async putProfile(p: ConnectProfile) {
    await this.col("profiles").doc(p.id).set(p);
    return p;
  }
  async listProfiles() {
    const now = new Date().toISOString();
    const snap = await this.col("profiles").where("expiresAt", ">", now).get();
    return snap.docs.map((d) => d.data() as ConnectProfile);
  }
  async deleteProfile(id: string) {
    await this.col("profiles").doc(id).delete();
  }
  async clear() {
    for (const name of ["orders", "feedback", "profiles"]) {
      const snap = await this.col(name).limit(500).get();
      const batch = this.db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}
