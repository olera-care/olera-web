import type { Metadata } from "next";
import ProviderJobBrowseView from "@/components/browse/ProviderJobBrowseView";

export const metadata: Metadata = {
  title: "Caregiver Opportunities | Olera",
  description:
    "Find caregiver job opportunities with senior care organizations. Browse open positions and apply directly.",
};

export default function BrowseProvidersForJobsPage() {
  return <ProviderJobBrowseView layout="standalone" />;
}
