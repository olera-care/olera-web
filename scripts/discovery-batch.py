#!/usr/bin/env python3
"""
Batch Senior Care Provider Discovery
Non-interactive wrapper for discovering providers across multiple cities.

Usage:
  python3 scripts/discovery-batch.py --batch cities.csv --mode quick --auto-confirm
  python3 scripts/discovery-batch.py --cities "Oyster Bay,NY;Richardson,TX" --mode quick --auto-confirm

Cities CSV format: city,state (one per line, no header needed)
"""

import os
import sys
import asyncio
import aiohttp
import json
import csv
import re
import time
import hashlib
import ssl
import certifi
import argparse
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Set, Any
from dataclasses import dataclass, field
from collections import defaultdict

# Load env from olera-web
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))
load_dotenv(os.path.expanduser('~/Desktop/olera-web/.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

# ============================================================================
# SEARCH PATTERNS (from discovery.py)
# ============================================================================

SEARCH_PATTERNS = {
    'assisted_living': [
        'assisted living', 'assisted living facility', 'assisted living community',
        'senior assisted living', 'assisted care', 'residential care',
        'board and care', 'personal care home', 'residential care facility',
        'adult family home', 'senior residence', 'senior community'
    ],
    'memory_care': [
        'memory care', 'alzheimer care', 'dementia care', 'memory unit',
        'memory care facility', 'cognitive care', 'specialized dementia',
        'memory support', 'alzheimer facility', 'dementia facility'
    ],
    'nursing_home': [
        'nursing home', 'skilled nursing', 'skilled nursing facility',
        'long term care', 'convalescent home', 'rehabilitation center',
        'rehab facility', 'post acute care', 'subacute care', 'SNF'
    ],
    'home_care': [
        'home care', 'home health', 'home health care', 'in home care',
        'home care agency', 'home health agency', 'visiting nurse',
        'home aide', 'home assistance', 'senior home care', 'elderly care'
    ],
    'home_care_non_medical': [
        'companion care', 'non medical home care', 'personal care',
        'homemaker services', 'companion services', 'senior companions',
        'elderly companion', 'respite care', 'senior helpers', 'caregiver'
    ],
    'independent_living': [
        'independent living', 'retirement community', 'senior apartments',
        '55+', '55 plus community', 'active adult', 'senior housing',
        'retirement home', 'senior village', 'continuing care'
    ]
}

# Quick mode: fewer search terms per category (top 3)
QUICK_PATTERNS = {k: v[:3] for k, v in SEARCH_PATTERNS.items()}

# Standard mode: all search terms
STANDARD_PATTERNS = SEARCH_PATTERNS

ALL_CARE_TYPES = list(SEARCH_PATTERNS.keys())

# ============================================================================
# DISCOVERY ENGINE
# ============================================================================

class BatchDiscovery:
    def __init__(self, api_key: str, mode: str = 'quick'):
        self.api_key = api_key
        self.mode = mode
        self.patterns = QUICK_PATTERNS if mode == 'quick' else STANDARD_PATTERNS
        self.search_url = "https://places.googleapis.com/v1/places:searchText"
        self.api_calls = 0
        self.search_cache: Dict[str, Any] = {}
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        connector = aiohttp.TCPConnector(ssl=ssl_context, limit=50, ttl_dns_cache=300)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(connector=connector, timeout=timeout)
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    async def search_text(self, query: str, max_results: int = 20) -> List[Dict]:
        """Execute Google Places text search"""
        cache_key = hashlib.md5(query.encode()).hexdigest()
        if cache_key in self.search_cache:
            return self.search_cache[cache_key]

        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.api_key,
            'X-Goog-FieldMask': (
                'places.id,places.displayName,places.formattedAddress,'
                'places.location,places.primaryType,places.types,'
                'places.nationalPhoneNumber,places.internationalPhoneNumber,'
                'places.websiteUri,places.rating,places.userRatingCount,'
                'places.businessStatus,nextPageToken'
            )
        }

        payload = {
            'textQuery': query,
            'maxResultCount': max_results,
            'rankPreference': 'RELEVANCE',
            'languageCode': 'en'
        }

        all_results = []
        next_page_token = None
        max_pages = 3

        for page in range(max_pages):
            if next_page_token:
                payload['pageToken'] = next_page_token

            for retry in range(3):
                try:
                    async with self.session.post(self.search_url, json=payload, headers=headers) as resp:
                        self.api_calls += 1
                        if resp.status == 200:
                            data = await resp.json()
                            places = data.get('places', [])
                            all_results.extend(places)
                            next_page_token = data.get('nextPageToken')
                            if not next_page_token:
                                break
                            await asyncio.sleep(0.5)
                            break
                        elif resp.status == 429:
                            wait = 2 ** retry
                            logger.warning(f"Rate limited, waiting {wait}s...")
                            await asyncio.sleep(wait)
                        else:
                            error = await resp.text()
                            logger.error(f"API error {resp.status}: {error[:200]}")
                            break
                except asyncio.TimeoutError:
                    logger.warning(f"Timeout for '{query}', retry {retry+1}/3")
                    await asyncio.sleep(2 ** retry)
                except Exception as e:
                    logger.error(f"Error for '{query}': {e}")
                    break

            if not next_page_token:
                break

        if all_results:
            self.search_cache[cache_key] = all_results
        return all_results

    def parse_place(self, place: Dict, city: str, state: str, category: str, method: str) -> Optional[Dict]:
        """Parse a Google Place result into a provider dict"""
        try:
            place_id = place.get('id', '')
            if not place_id:
                return None

            display_name = place.get('displayName', {})
            name = display_name.get('text', '') if isinstance(display_name, dict) else str(display_name)
            if not name:
                return None

            location = place.get('location', {})
            formatted_address = place.get('formattedAddress', '')
            address_parts = formatted_address.split(',') if formatted_address else []

            # Extract ZIP
            zipcode = ''
            zip_match = re.search(r'\b(\d{5}(?:-\d{4})?)\b', formatted_address)
            if zip_match:
                zipcode = zip_match.group(1)

            phone = place.get('nationalPhoneNumber') or place.get('internationalPhoneNumber') or ''

            return {
                'place_id': place_id,
                'provider_name': name,
                'address': address_parts[0].strip() if address_parts else '',
                'city': city,
                'state': state,
                'zipcode': zipcode,
                'lat': location.get('latitude', 0),
                'lon': location.get('longitude', 0),
                'phone': phone,
                'website': place.get('websiteUri', ''),
                'google_rating': place.get('rating'),
                'review_count': place.get('userRatingCount', 0),
                'types': ','.join(place.get('types', [])),
                'provider_category': category,
                'subcategory': '',
                'discovery_method': method,
                'confidence_score': 1.0,
                'business_status': place.get('businessStatus', ''),
            }
        except Exception as e:
            logger.debug(f"Parse error: {e}")
            return None

    async def discover_city(self, city: str, state: str) -> List[Dict]:
        """Discover all providers in a city using configured search mode"""
        logger.info(f"Discovering: {city}, {state}")
        all_providers = []
        seen_place_ids = set()

        for care_type in ALL_CARE_TYPES:
            terms = self.patterns.get(care_type, [])
            for term in terms:
                query = f"{term} in {city}, {state}"
                results = await self.search_text(query)

                for place in results:
                    pid = place.get('id', '')
                    if pid in seen_place_ids:
                        continue
                    seen_place_ids.add(pid)

                    provider = self.parse_place(place, city, state, care_type, 'traditional_search')
                    if provider:
                        all_providers.append(provider)

                await asyncio.sleep(0.3)

        logger.info(f"  {city}, {state}: {len(all_providers)} unique providers ({self.api_calls} API calls)")
        return all_providers

    def get_cost(self) -> float:
        """Get estimated cost based on API calls ($32/1000 for text search)"""
        return (self.api_calls * 32) / 1000


def parse_cities(args) -> List[Tuple[str, str]]:
    """Parse city list from args"""
    cities = []

    if args.cities:
        # Parse "City1,ST;City2,ST" format
        for pair in args.cities.split(';'):
            parts = pair.strip().split(',')
            if len(parts) == 2:
                cities.append((parts[0].strip(), parts[1].strip()))

    if args.batch:
        path = os.path.expanduser(args.batch)
        with open(path, 'r') as f:
            content = f.read()

        # Try to detect format
        if path.endswith('.md'):
            # Parse machine-readable list from markdown
            lines = content.split('\n')
            in_list = False
            for line in lines:
                line = line.strip()
                if 'Machine-Readable' in line or 'machine-readable' in line:
                    in_list = True
                    continue
                if in_list and ',' in line and len(line.split(',')) == 2:
                    city, state = line.split(',')
                    city = city.strip()
                    state = state.strip()
                    if city and state and len(state) == 2:
                        cities.append((city, state))
                elif in_list and line.startswith('#'):
                    break  # End of section
        else:
            # CSV format
            reader = csv.reader(content.strip().split('\n'))
            for row in reader:
                if len(row) >= 2:
                    city, state = row[0].strip(), row[1].strip()
                    if city and state and city.lower() != 'city':
                        cities.append((city, state))

    return cities


async def main():
    parser = argparse.ArgumentParser(description='Batch senior care provider discovery')
    parser.add_argument('--batch', help='Path to batch file (CSV or MD)')
    parser.add_argument('--cities', help='Inline cities: "City1,ST;City2,ST"')
    parser.add_argument('--mode', choices=['quick', 'standard'], default='quick')
    parser.add_argument('--auto-confirm', action='store_true', help='Skip cost confirmation')
    parser.add_argument('--force', action='store_true', help='Re-discover cities with existing CSVs')
    parser.add_argument('--output-dir', default=os.path.expanduser('~/Desktop/TJ-hq/Olera/Provider Database/Expansion'))
    args = parser.parse_args()

    cities = parse_cities(args)
    if not cities:
        print("No cities provided. Use --batch <file> or --cities 'City,ST;City2,ST'")
        sys.exit(1)

    api_key = os.environ.get('GOOGLE_PLACES_API_KEY')
    if not api_key:
        print("ERROR: GOOGLE_PLACES_API_KEY not found. Check .env.local")
        sys.exit(1)

    # Estimate costs
    terms_per_type = 3 if args.mode == 'quick' else len(max(SEARCH_PATTERNS.values(), key=len))
    est_calls = len(cities) * len(ALL_CARE_TYPES) * terms_per_type
    est_cost = (est_calls * 32) / 1000

    print(f"\n{'='*70}")
    print(f"BATCH DISCOVERY — {len(cities)} cities, {args.mode} mode")
    print(f"{'='*70}")
    for i, (city, state) in enumerate(cities, 1):
        print(f"  {i:2d}. {city}, {state}")
    print(f"\nEstimated API calls: ~{est_calls:,}")
    print(f"Estimated cost: ~${est_cost:.2f}")
    print(f"Output: {args.output_dir}")

    if not args.auto_confirm:
        confirm = input("\nContinue? (y/n): ").strip().lower()
        if confirm != 'y':
            print("Cancelled.")
            return

    # Check which cities already have discovery CSVs
    output_dir = os.path.expanduser(args.output_dir)
    skip_cities = []
    run_cities = []

    for city, state in cities:
        city_dir = os.path.join(output_dir, f"{city.replace(' ', '-')}-{state}")
        existing = [f for f in os.listdir(city_dir) if f.startswith('providers_discovered_') and f.endswith('.csv')] if os.path.exists(city_dir) else []
        if existing and not args.force:
            skip_cities.append((city, state, existing[0]))
        else:
            run_cities.append((city, state))

    if skip_cities:
        print(f"\nSkipping {len(skip_cities)} cities with existing CSVs:")
        for city, state, fname in skip_cities:
            print(f"  {city}, {state} → {fname}")

    if not run_cities:
        print("\nAll cities already discovered. Use --force to re-run.")
        return

    print(f"\nDiscovering {len(run_cities)} cities...\n")

    # Run discovery
    start_time = time.time()
    results = {}

    async with BatchDiscovery(api_key, args.mode) as discovery:
        for i, (city, state) in enumerate(run_cities):
            city_start = time.time()
            providers = await discovery.discover_city(city, state)

            # Save CSV
            city_dir = os.path.join(output_dir, f"{city.replace(' ', '-')}-{state}")
            os.makedirs(city_dir, exist_ok=True)

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            csv_path = os.path.join(city_dir, f"providers_discovered_{timestamp}.csv")

            if providers:
                fieldnames = providers[0].keys()
                with open(csv_path, 'w', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(providers)

            elapsed = time.time() - city_start
            results[(city, state)] = {
                'count': len(providers),
                'csv': csv_path,
                'time': elapsed,
            }

            # Category breakdown
            cats = defaultdict(int)
            for p in providers:
                cats[p['provider_category']] += 1

            print(f"  [{i+1}/{len(run_cities)}] {city}, {state}: {len(providers)} providers ({elapsed:.1f}s)")
            for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
                print(f"        {cat}: {count}")

        total_cost = discovery.get_cost()

    # Summary
    elapsed = time.time() - start_time
    total_providers = sum(r['count'] for r in results.values())

    print(f"\n{'='*70}")
    print(f"BATCH DISCOVERY COMPLETE")
    print(f"{'='*70}")
    print(f"  Cities: {len(run_cities)}")
    print(f"  Total providers: {total_providers:,}")
    print(f"  Total time: {elapsed/60:.1f} minutes")
    print(f"  Estimated cost: ${total_cost:.2f}")
    print(f"\n  Per-city results:")
    for (city, state), r in results.items():
        print(f"    {city}, {state}: {r['count']} providers → {r['csv']}")
    print(f"{'='*70}\n")


if __name__ == '__main__':
    asyncio.run(main())
