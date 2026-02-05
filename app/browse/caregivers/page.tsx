import type { Metadata } from "next";
import CaregiverBrowseView from "@/components/browse/CaregiverBrowseView";

export const metadata: Metadata = {
  title: "Browse Private Caregivers | Olera",
  description:
    "Find experienced private caregivers in your area. Browse profiles, review qualifications, and connect directly.",
};

export default function BrowseCaregiversPage() {
  return <CaregiverBrowseView layout="standalone" />;
}
