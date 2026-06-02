import { readFileSync } from "node:fs";
import path from "node:path";
import MarketDiagnostic, { type MarketDiagnosticData } from "@/components/provider/market/MarketDiagnostic";

// Admin preview of the provider "Your Market" diagnostic (College Station snapshot).
export default function MarketDiagnosticPage() {
  const p = path.join(process.cwd(), "data/market-diagnostic/college-station.analysis.json");
  const data = JSON.parse(readFileSync(p, "utf8")) as MarketDiagnosticData;
  return <MarketDiagnostic data={data} />;
}
