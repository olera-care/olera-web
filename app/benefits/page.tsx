import { redirect } from "next/navigation";

export default async function BenefitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(params).toString();
  redirect(`/benefits/finder${query ? `?${query}` : ""}`);
}
