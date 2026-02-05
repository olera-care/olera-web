import type { Metadata } from "next";
import FamilyBrowseView from "@/components/browse/FamilyBrowseView";

export const metadata: Metadata = {
  title: "Families Looking for Care | Olera",
  description:
    "Browse families actively looking for senior care. Connect with families that match your services.",
};

export default function BrowseFamiliesPage() {
  return <FamilyBrowseView layout="standalone" />;
}
