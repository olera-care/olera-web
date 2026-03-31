import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const slug = process.argv[2];
  if (!slug) { console.error("Usage: npx tsx scripts/_set-draft.ts <slug>"); process.exit(1); }
  const { error } = await db.from("content_articles").update({ status: "draft", published_at: null }).eq("slug", slug);
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`"${slug}" set to draft.`);
}
main();
