"use client";

export function CityBadge({ name }: { name: string }) {
  return (
    <button
      onClick={() => {
        document.dispatchEvent(
          new CustomEvent("flyToCity", { detail: name })
        );
        // Scroll the map into view on mobile where it's stacked below
        const mapEl = document.querySelector(".leaflet-container");
        if (mapEl) {
          mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }}
      className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors cursor-pointer"
    >
      {name}
    </button>
  );
}
