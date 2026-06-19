/**
 * One-off: upload Grazie's signature photo to the Supabase public bucket so
 * cold/activation emails can link a non-WAF host (olera.care/images/* is
 * WAF-challenged and fails to render in inboxes).
 *
 * Run where SUPABASE_SERVICE_ROLE_KEY is available:
 *   npx tsx scripts/upload-grazie-photo.ts
 *
 * After it prints OK, flip GRAZIE_PHOTO_URL's default in smartlead-bridge.ts +
 * email-send.ts to the printed URL.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  const db = createClient(url, key);
  const bytes = await readFile("public/images/for-providers/team/grazie.png");
  const path = "team/grazie.png";
  const { error } = await db.storage
    .from("content-images")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (error) throw error;
  console.log(`OK → ${url}/storage/v1/object/public/content-images/${path}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
