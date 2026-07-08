"use client";

import { useState } from "react";

type Tab = "provider-page" | "admin-trigger" | "first-contact";

const TABS: { id: Tab; label: string }[] = [
  { id: "provider-page", label: "Provider Page" },
  { id: "admin-trigger", label: "Admin Trigger" },
  { id: "first-contact", label: "First Contact" },
];

export default function ColdOutreachDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("provider-page");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "provider-page" && <ProviderPageTab />}
        {activeTab === "admin-trigger" && <AdminTriggerTab />}
        {activeTab === "first-contact" && <FirstContactTab />}
      </div>
    </div>
  );
}

// =============================================================================
// Tab 1: Provider Page
// =============================================================================
function ProviderPageTab() {
  return (
    <div>
      {/* Hero Section - We'll iterate on this first */}
      <section className="bg-white">
        <div className="px-4 py-12">
          <p className="text-gray-500 text-center">
            Provider Page Hero — ready to iterate
          </p>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// Tab 2: Admin Trigger
// =============================================================================
function AdminTriggerTab() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Admin Trigger
        </h2>
        <p className="text-gray-500">
          Admin dashboard to initiate cold outreach — coming next
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Tab 3: First Contact Experience
// =============================================================================
function FirstContactTab() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Provider First Contact
        </h2>
        <p className="text-gray-500">
          What the provider sees when they receive outreach — coming later
        </p>
      </div>
    </div>
  );
}
