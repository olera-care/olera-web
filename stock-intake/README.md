# Stock image intake

Drop **provably-licensed** stock photos here so they can be optimized,
placed into the served fallback library (`public/images/fallback/`), and
recorded in the license manifest (`public/images/fallback/CREDITS.json`).

This folder is a **staging area only** — originals are processed and then
removed before the work merges to `staging`. Nothing here is served to users.

## How to add images

1. Sort each photo into the subfolder for the care category it best fits:
   - `home-care/` — in-home, non-medical / home-health scenes
   - `assisted-living/`
   - `independent-living/`
   - `memory-care/`
   - `nursing-home/`
   - `general/` — senior-care scenes that don't clearly fit one bucket
     (used for the default pool / assigned later)
2. **Keep the original Pexels filename.** The filename
   (e.g. `pexels-jsme-mila-523821574-18429308.jpg`) encodes the
   photographer slug and the photo ID, which is used to auto-derive the
   credit (`https://www.pexels.com/photo/<id>/`) for the manifest. Do not
   rename before uploading.

## License rule (do not skip)

Only add images with a clean, free-for-commercial-use license. Pexels and
Unsplash both qualify (free, commercial, modifiable, no attribution
required). If you can't point to the source URL + license, it doesn't go in.
