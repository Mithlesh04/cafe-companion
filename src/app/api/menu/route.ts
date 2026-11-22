import { json } from "@/lib/api";
import { MENU } from "@/lib/menu";

export async function GET() {
  return json({ items: MENU }, { headers: { "Cache-Control": "public, max-age=300" } });
}
