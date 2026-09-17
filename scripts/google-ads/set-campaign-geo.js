/**
 * Set a campaign's geographic targeting from a Google Ads Script.
 *
 * WHY THIS EXISTS: on 2026-09-17 the Google Ads web campaign settings editor
 * stopped rendering its lazy sections account-wide — Locations included. Every
 * section under "Other settings" sits at "Loading name / Loading summary"
 * forever, under a footer that always says "Turn off ad blockers" (that string
 * is static boilerplate on every Google Ads page, so it is not a signal).
 * Reproduced in TJ's own Chrome and in a clean automation profile, on more than
 * one campaign, so it is Google-side and not ours. The Scripts surface renders
 * fine, so geo changes go through here until the editor comes back.
 *
 * A radius target ("20 mi around Pascagoula") is a PROXIMITY, not a location.
 * The two are separate collections on the targeting object and a campaign can
 * hold both at once, so clearing one does not clear the other. Getting this
 * wrong leaves the old radius serving alongside the new counties.
 *
 * Criterion IDs come from Google's published geotargets file
 * (developers.google.com/google-ads/api/data/geo/geotargets-2025-01-13.csv).
 * They are stable; look up new ones there rather than guessing.
 *
 * USAGE: set DRY_RUN = true and Preview first. It logs what is targeted now and
 * what it would change, and writes nothing. Then set DRY_RUN = false, Save, and
 * Preview once more — Google's own preview sandboxes the writes and shows the
 * real change rows — before Run. Afterwards set DRY_RUN back to true and Preview
 * to read the final state back; that read-back is the verification, because
 * Google has silently reverted scripted writes before.
 *
 * Applied 2026-09-17 to Hoop Cares as script 12335624 in account 419-933-1442.
 * Before: one 20-mile proximity around 30.365755,-88.556127 and ZERO locations.
 * After: Harrison, Jackson and George County, no proximity. 4 changes, all
 * successful. The before-state is the reason the proximity handling matters —
 * a locations-only script would have removed nothing and double-targeted.
 */

var DRY_RUN = true;

var CAMPAIGN_ID = 24235451655; // Hoop Cares – Pascagoula – Sep 2026

// Harrison / Jackson / George County, Mississippi — her own stated service area,
// confirmed by Liz Hoop on the 2026-09-16 orientation call and on her flyer.
var TARGET_LOCATION_IDS = [9058330, 9058336, 9058326];

function main() {
  var it = AdsApp.campaigns().withIds([CAMPAIGN_ID]).get();
  if (!it.hasNext()) {
    Logger.log('ABORT: no campaign with id ' + CAMPAIGN_ID);
    return;
  }
  var campaign = it.next();
  Logger.log('Campaign: ' + campaign.getName() + '  (' + (DRY_RUN ? 'DRY RUN' : 'APPLYING') + ')');

  var targeting = campaign.targeting();

  // --- what is targeted right now -----------------------------------------
  var locations = [];
  var locIt = targeting.targetedLocations().get();
  while (locIt.hasNext()) {
    var loc = locIt.next();
    locations.push(loc);
    Logger.log('  current location : ' + loc.getName() + ' (id ' + loc.getId() + ')');
  }

  var proximities = [];
  var proxIt = targeting.targetedProximities().get();
  while (proxIt.hasNext()) {
    var prox = proxIt.next();
    proximities.push(prox);
    Logger.log('  current radius   : ' + prox.getRadius() + ' ' + prox.getRadiusUnits() +
               ' around ' + prox.getLatitude() + ',' + prox.getLongitude());
  }

  if (locations.length === 0 && proximities.length === 0) {
    Logger.log('  (campaign currently targets nothing specific)');
  }

  // --- what we intend to do ------------------------------------------------
  var alreadyTargeted = {};
  for (var i = 0; i < locations.length; i++) alreadyTargeted[String(locations[i].getId())] = true;

  var toAdd = [];
  for (var j = 0; j < TARGET_LOCATION_IDS.length; j++) {
    var id = TARGET_LOCATION_IDS[j];
    if (alreadyTargeted[String(id)]) {
      Logger.log('  keep             : ' + id + ' (already targeted)');
    } else {
      toAdd.push(id);
      Logger.log('  WILL ADD         : location ' + id);
    }
  }

  // Locations we hold that are not in the wanted set, and every radius.
  var toRemove = [];
  var wanted = {};
  for (var k = 0; k < TARGET_LOCATION_IDS.length; k++) wanted[String(TARGET_LOCATION_IDS[k])] = true;
  for (var m = 0; m < locations.length; m++) {
    if (!wanted[String(locations[m].getId())]) {
      toRemove.push(locations[m]);
      Logger.log('  WILL REMOVE      : location ' + locations[m].getName());
    }
  }
  for (var n = 0; n < proximities.length; n++) {
    Logger.log('  WILL REMOVE      : radius ' + proximities[n].getRadius() + ' ' +
               proximities[n].getRadiusUnits());
  }

  if (DRY_RUN) {
    Logger.log('DRY RUN — nothing written. Set DRY_RUN = false and Run to apply.');
    return;
  }

  // --- apply ---------------------------------------------------------------
  // Add before removing, so the campaign is never left targeting nothing (a
  // campaign with no geo target serves nationally).
  for (var a = 0; a < toAdd.length; a++) {
    campaign.addLocation(toAdd[a]);
    Logger.log('  added location ' + toAdd[a]);
  }
  for (var b = 0; b < toRemove.length; b++) {
    toRemove[b].remove();
    Logger.log('  removed location ' + toRemove[b].getName());
  }
  for (var c = 0; c < proximities.length; c++) {
    proximities[c].remove();
    Logger.log('  removed radius');
  }

  Logger.log('Done. Re-run with DRY_RUN = true to confirm the final state.');
}
