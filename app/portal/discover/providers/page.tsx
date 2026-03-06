import { redirect } from "next/navigation";

export default function DiscoverProvidersPage() {
  redirect("/provider/matches?tab=organizations");
}
