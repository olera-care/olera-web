# Plan: Migrate from Leaflet + CartoDB to MapLibre GL JS + MapTiler

## Context

The browse page map currently uses **Leaflet** (raster tile library) with **CartoDB Positron** tiles. While functional, this has limitations: raster tiles look blurry on retina, no smooth zoom interpolation, no dynamic styling, and Leaflet's marker/popup API is dated. **MapLibre GL JS** is the modern open-source standard (GPU-accelerated vector tiles, smooth zooming, retina-sharp), and **MapTiler** provides beautiful free-tier tile styles designed to pair with MapLibre.

The migration is well-scoped: all Leaflet usage is isolated to a single component (`BrowseMap.tsx`). No other components use Leaflet.

---

## Changes

### 1. Install MapLibre GL JS, remove Leaflet

```bash
npm install maplibre-gl
npm uninstall leaflet @types/leaflet
```

MapLibre GL JS ships with its own TypeScript types — no separate `@types` package needed.

### 2. Add MapTiler API key

- Add `NEXT_PUBLIC_MAPTILER_KEY` to `.env.example`
- User adds real key to Vercel env vars for staging/production
- Free tier: 100K tile loads/month

### 3. Rewrite `components/browse/BrowseMap.tsx`

Full rewrite (~300 lines). Same props interface, same behavior, new library:

| Leaflet concept | MapLibre GL JS equivalent |
|-----------------|--------------------------|
| `L.map()` | `new maplibregl.Map()` |
| `L.tileLayer(CartoDB URL)` | `style: "https://api.maptiler.com/maps/positron/style.json?key=..."` |
| `L.divIcon` + `L.marker` | GeoJSON source + symbol/circle layers |
| `marker.bindPopup(html)` | `map.on("click", layer)` + `maplibregl.Popup` |
| `marker.on("mouseover")` | `map.on("mouseenter", layer)` |
| `map.fitBounds(latLngBounds)` | `map.fitBounds([[sw], [ne]])` |
| `marker.setZIndexOffset()` | Feature state + paint expressions |
| `import "leaflet/dist/leaflet.css"` | `import "maplibre-gl/dist/maplibre-gl.css"` |

**Key implementation details:**

- **Markers as layers**: Instead of individual `L.marker` objects, use a single GeoJSON source with a `circle` layer for score bubbles and a `symbol` layer for text. This is far more performant at scale.
- **Hover state**: Use `map.setFeatureState()` to toggle hover — paint expressions drive the visual change (scale, color). No need to recreate icons.
- **Popups**: Create a `maplibregl.Popup` on click, populate with the same HTML builder (`buildPopupHTML`).
- **Score bubble styling**: CSS for `.olera-bubble` replaced by MapLibre paint properties (`circle-radius`, `circle-color`, `text-field`).
- **Zoom controls**: `new maplibregl.NavigationControl()` positioned top-right.
- **Attribution**: MapTiler styles include attribution automatically. Add custom Olera attribution if needed.

### 4. Update `docs/design-system.md`

Update the map section to reference MapLibre GL JS + MapTiler instead of Leaflet + CartoDB.

### 5. Create `docs/adr/001-maplibre-maptiler.md`

Architecture Decision Record documenting:
- Why we chose MapLibre GL JS over Leaflet, Mapbox, Google Maps
- Why MapTiler over CartoDB, Stadia Maps, Protomaps
- Cost analysis at various scales
- Future path to self-hosted tiles if needed

---

## Files to modify

1. **`package.json`** — Remove leaflet deps, add maplibre-gl
2. **`components/browse/BrowseMap.tsx`** — Full rewrite (same interface)
3. **`.env.example`** — Add `NEXT_PUBLIC_MAPTILER_KEY`
4. **`docs/design-system.md`** — Update map references
5. **`docs/adr/001-maplibre-maptiler.md`** — New ADR document

Files **not** modified:
- `BrowseClient.tsx` — dynamic import stays the same, props unchanged
- `BrowseCard.tsx` — no map involvement
- `ProviderMap.tsx` — uses OSM embed iframe, not Leaflet
- `next.config.ts` — no special config needed

---

## Verification

1. `npm run build` — no TypeScript errors, no leaflet references
2. Visit `/browse` — map loads with MapTiler tiles (should look similar to CartoDB Positron but crisper)
3. Score bubbles display with correct ratings
4. Hover a card in the list — corresponding map bubble highlights
5. Click a bubble — popup card appears with provider info
6. Map fits bounds to visible providers
7. Zoom controls work (top right)
8. Mobile: map hidden, no errors in console
9. Smooth zoom animation (vector tile advantage)
