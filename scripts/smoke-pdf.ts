import { renderProgramPdf } from "../lib/program-pdf/generate";
import { writeFileSync } from "node:fs";

async function main() {
  const buf = await renderProgramPdf("texas-am");
  writeFileSync("/tmp/program.pdf", buf);
  console.log("PDF bytes:", buf.length, "→ /tmp/program.pdf");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
