/**
 * Authoritative city/state reconciliation for a city-pipeline run.
 *
 * THE BUG THIS PREVENTS (2026-06-03): the importers stamp the RUN's city onto
 * every discovered provider, but discovery returns a wide radius. That created
 * the "Navasota, TX" dumping ground — Bryan/College-Station agencies, plus
 * out-of-area and even Florida rows, all labeled Navasota, TX.
 *
 * Forward-geocoding the address with the (wrong) run city as the anchor is
 * UNRELIABLE — Google sometimes keeps the wrong anchor city. The only
 * authoritative source is the provider's own Google listing (place_id), which
 * yields the true locality/state/coords. This step calls Places Details by
 * place_id for every active row in the run and corrects city/state/zip/coords,
 * soft-deleting rows that resolve outside the run's state.
 *
 * Call it as the LAST import step, after upload + coordinate geocoding.
 */

const PLACES_DETAILS = (id, key) =>
  `https://places.googleapis.com/v1/places/${id}?fields=addressComponents,location&key=${key}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pick(components, type) {
  return (components || []).find((c) => (c.types || []).includes(type));
}

/**
 * @param {object}  opts
 * @param {object}  opts.supabase    Supabase client
 * @param {string}  opts.idPrefix    provider_id prefix for this run, e.g. "navasota-tx-"
 * @param {string}  opts.googleKey   Google API key (Places enabled)
 * @param {object} [opts.bounds]     {minLat,maxLat,minLon,maxLon} for the run's state (out-of-state → soft-delete)
 * @param {function}[opts.log]       optional logger
 */
async function reconcileRunLocations({ supabase, idPrefix, googleKey, bounds, log = () => {} }) {
  const { data: rows, error } = await supabase
    .from("olera-providers")
    .select("provider_id, provider_name, city, state, lat, lon, place_id")
    .like("provider_id", `${idPrefix}%`)
    .or("deleted.is.null,deleted.eq.false");
  if (error) { log(`  reconcile fetch error: ${error.message}`); return { error: error.message }; }

  let checked = 0, relabeled = 0, removed = 0, noPlaceId = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    if (!p.place_id) { noPlaceId++; continue; }
    checked++;
    try {
      const resp = await fetch(PLACES_DETAILS(p.place_id, googleKey));
      const j = await resp.json();
      if (j.error || !j.addressComponents) { errors++; await sleep(60); continue; }

      const loc = pick(j.addressComponents, "locality") || pick(j.addressComponents, "postal_town")
        || pick(j.addressComponents, "sublocality") || pick(j.addressComponents, "administrative_area_level_3");
      const st = pick(j.addressComponents, "administrative_area_level_1");
      const zip = pick(j.addressComponents, "postal_code");
      const lat = j.location?.latitude ?? null;
      const lon = j.location?.longitude ?? null;
      const trueCity = loc?.longText || null;
      const trueState = st?.shortText || null;

      // Out-of-run-state → discovery noise; soft-delete instead of mislabeling.
      if (bounds && lat != null && (lat < bounds.minLat || lat > bounds.maxLat || lon < bounds.minLon || lon > bounds.maxLon)) {
        await supabase.from("olera-providers")
          .update({ deleted: true, deleted_at: new Date().toISOString() })
          .eq("provider_id", p.provider_id);
        removed++;
        log(`  − removed (out-of-state): ${p.provider_name} → ${trueCity}, ${trueState}`);
        await sleep(60);
        continue;
      }

      const patch = {};
      if (trueCity && trueCity.toLowerCase() !== (p.city || "").toLowerCase()) patch.city = trueCity;
      if (trueState && trueState !== p.state) patch.state = trueState;
      if (zip?.longText) patch.zipcode = zip.longText;
      if (lat != null && (Math.abs((p.lat || 0) - lat) > 0.0005 || Math.abs((p.lon || 0) - lon) > 0.0005)) {
        patch.lat = lat; patch.lon = lon;
      }
      if (patch.city || patch.state) {
        relabeled++;
        log(`  ↻ ${p.provider_name}: ${p.city}, ${p.state} → ${patch.city || p.city}, ${patch.state || p.state}`);
      }
      if (Object.keys(patch).length) {
        await supabase.from("olera-providers").update(patch).eq("provider_id", p.provider_id);
      }
    } catch (e) {
      errors++;
    }
    await sleep(60); // rate limit
  }

  log(`  Location reconcile: ${checked} checked, ${relabeled} relabeled, ${removed} out-of-state removed, ${noPlaceId} no place_id, ${errors} errors`);
  return { checked, relabeled, removed, noPlaceId, errors };
}

module.exports = { reconcileRunLocations };
