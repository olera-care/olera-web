# ADR 001: MapLibre GL JS + MapTiler for Browse Page Map

**Date:** 2026-02-20
**Status:** Accepted
**Deciders:** Temi

---

## Context

The browse page (`/browse`) shows a split layout: provider cards on the left, an interactive map on the right. The map displays score bubbles for each provider, supports hover-highlight sync with the card list, and click-to-popup preview cards.

The initial implementation used **Leaflet** (raster tile library) with **CartoDB Positron** tiles. We evaluated alternatives before committing to the long-term map stack.

---

## Options Evaluated

### Map Libraries

| Library | Rendering | License | Bundle Size | Notes |
|---------|-----------|---------|-------------|-------|
| **Leaflet** | Raster | BSD-2 | ~42KB gzip | Mature, huge plugin ecosystem. Raster tiles look blurry on retina. No smooth zoom interpolation. DOM-based markers scale poorly. |
| **MapLibre GL JS** | Vector (WebGL) | BSD-3 | ~220KB gzip | Open-source fork of Mapbox GL JS v1. GPU-accelerated vector tiles, retina-sharp, smooth zoom, data-driven styling. Active community. |
| **Mapbox GL JS v3** | Vector (WebGL) | Proprietary | ~230KB gzip | Best-in-class features (3D, globe). Requires Mapbox access token. Pricing: $5/1K map loads after 50K free. Lock-in risk. |
| **Google Maps JS** | Raster+Vector | Proprietary | External | $7/1K loads after $200/mo credit. Heavy SDK, opinionated styling. Overkill for our use case. |

### Tile Providers

| Provider | Style Quality | Free Tier | Self-Host Option | Notes |
|----------|-------------|-----------|-----------------|-------|
| **CartoDB/CARTO** | Good (Positron, Dark Matter) | Generous | No | Raster only. No vector tile support for MapLibre. |
| **MapTiler** | Excellent (Positron, Streets, Topo) | 100K loads/mo | Yes (OpenMapTiles) | Built for MapLibre. Clean styles, fast CDN. Easy upgrade to self-hosted. |
| **Stadia Maps** | Good (Alidade, Stamen) | 200K loads/mo | No | Good free tier. Fewer style options than MapTiler. |
| **Protomaps** | Basic | Self-host only | Yes (PMTiles) | Zero cost if self-hosted on S3/R2. Requires own tile generation. More ops work. |

---

## Decision

**MapLibre GL JS** for the map library + **MapTiler** for tile hosting.

### Why MapLibre GL JS

1. **Vector tiles are sharper** — WebGL rendering is pixel-perfect on retina displays. Leaflet's raster tiles are visibly blurry at 2x.
2. **Smooth interactions** — Continuous zoom, pitch, and rotation. Leaflet snaps between zoom levels.
3. **Performance at scale** — GeoJSON sources with data-driven layers handle hundreds of markers in a single draw call. Leaflet creates individual DOM elements per marker.
4. **Feature state for hover** — `map.setFeatureState()` lets us toggle hover styling without recreating icons. Leaflet requires calling `marker.setIcon()` with a new `DivIcon`.
5. **Open source, no lock-in** — BSD-3 license. If Mapbox GL JS moves further from open-source, MapLibre continues independently.
6. **Bundle size trade-off is acceptable** — 220KB vs 42KB, but we lazy-load the map with `next/dynamic`. The map panel is hidden on mobile, so most users never download it.

### Why MapTiler

1. **Designed for MapLibre** — Style JSON URLs work natively (`https://api.maptiler.com/maps/positron/style.json?key=...`).
2. **100K free loads/month** — More than enough for current traffic. At $0.05/1K after that, highly affordable.
3. **Clean Positron style** — Nearly identical to CartoDB Positron (what we had), so no visual regression.
4. **Self-host escape hatch** — MapTiler publishes OpenMapTiles. If we outgrow the free tier, we can self-host on S3/Cloudflare R2 with zero vendor lock-in.

### Why Not Mapbox

- Proprietary license since v2. Using it means accepting license terms that restrict forking.
- $5/1K map loads after 50K free — would cost real money at scale.
- We don't need 3D terrain, globe view, or Mapbox-specific features.

### Why Not Google Maps

- $7/1K loads, heavier SDK, and Google's opinionated styling doesn't match our design system.
- Adding the Google Maps script affects page load for all users, not just map viewers.

### Why Not Protomaps (self-hosted)

- Great long-term option, but premature for now. Requires PMTiles generation pipeline and hosting infra.
- MapTiler's free tier covers us. If costs grow, Protomaps is the escape hatch.

---

## Cost Projection

| Monthly Map Loads | MapTiler Cost | Mapbox Cost | Google Maps Cost |
|-------------------|--------------|-------------|-----------------|
| 50K | $0 | $0 | ~$150 |
| 100K | $0 | $250 | ~$500 |
| 500K | $20 | $2,250 | ~$3,300 |
| 1M | $45 | $4,750 | ~$6,800 |

At 1M loads/month, self-hosting with Protomaps/PMTiles on Cloudflare R2 would cost ~$5/month (storage + bandwidth).

---

## Migration Scope

All Leaflet usage is isolated to `components/browse/BrowseMap.tsx`. The migration is a single-file rewrite with no changes to `BrowseClient.tsx` (same props interface).

| Before | After |
|--------|-------|
| `leaflet` + `@types/leaflet` | `maplibre-gl` (types included) |
| `L.map()` | `new maplibregl.Map()` |
| CartoDB raster tiles | MapTiler Positron vector tiles |
| `L.divIcon` + `L.marker` per provider | GeoJSON source + circle/symbol layers |
| `marker.on("mouseover")` | `map.on("mouseenter", layer)` + feature state |
| `marker.bindPopup(html)` | `maplibregl.Popup` on click |

---

## Consequences

- **Positive**: Sharper map, smoother interactions, better performance, retina support, modern API
- **Positive**: Clear upgrade path to self-hosted tiles if costs grow
- **Negative**: Larger bundle (~220KB vs ~42KB), mitigated by lazy loading
- **Negative**: Requires `NEXT_PUBLIC_MAPTILER_KEY` env var (free to obtain)
- **Neutral**: Score bubble styling moves from CSS classes to MapLibre paint expressions
