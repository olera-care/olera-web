"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import FamilyProfileView from "@/components/portal/profile/FamilyProfileView";
import SettingsPage from "../settings/page";

export default function PortalProfilePage() {
  const { profiles, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");

  // Always use the family profile for this page — it's the shared personal info
  // page accessible from both portals. Every account has an auto-created family profile.
  const familyProfile = profiles.find((p) => p.type === "family") ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!familyProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>No family profile found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">
            {activeTab === "settings" ? "Account Settings" : "Profile"}
          </h2>
          <p className="text-[15px] text-gray-500 mt-1">
            {activeTab === "settings"
              ? "Manage your notifications, login, and preferences."
              : "Your personal information and care preferences."}
          </p>
        </div>
      </div>

      {/* Pill tabs */}
      <div className="flex gap-0.5 bg-vanilla-50 border border-warm-100/60 p-0.5 rounded-xl w-fit mb-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-2.5 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
            activeTab === "profile"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-5 py-2.5 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
            activeTab === "settings"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Account Settings
        </button>
      </div>

      {activeTab === "settings" ? (
        <SettingsPage />
      ) : (
        <FamilyProfileView profile={familyProfile} />
      )}
    </div>
    </div>
  );
}
