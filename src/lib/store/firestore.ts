import { Firestore, type Settings } from "@google-cloud/firestore";
import type { ConnectProfile, Feedback, Order } from "../types";
import type { Store } from "./types";

/**
 * Firestore-backed store (Google Cloud / Firebase Spark free tier).
 *
 * Credentials, in order of preference:
 * 1. FIREBASE_SERVICE_ACCOUNT: base64 or raw JSON of a service account key.
 *    This is what serverless hosts like Vercel need.
 * 2. Application Default Credentials (Cloud Run, local gcloud auth).
 *
 * Collections are prefixed so one project can host a pilot and production.
 */
export function firestoreSettings(projectId?: string, serviceAccount?: string): Settings {
  const settings: Settings = {};
  if (projectId) settings.projectId = projectId;
  if (serviceAccount) {
    const raw = serviceAccount.trim().startsWith("{") ? serviceAccount : Buffer.from(serviceAccount, "base64").toString("utf8");
    const key = JSON.parse(raw) as { project_id?: string; client_email: string; private_key: string };
    settings.projectId = settings.projectId ?? key.project_id;
    settings.credentials = { client_email: key.client_email, private_key: key.private_key.replace(/\\n/g, "\n") };
  }
  return settings;
}

export class FirestoreStore implements Store {
  private db: Firestore;
  private prefix: string;

  constructor(projectId?: string, serviceAccount?: string, prefix = "cafe") {
    this.db = new Firestore(firestoreSettings(projectId, serviceAccount));
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
