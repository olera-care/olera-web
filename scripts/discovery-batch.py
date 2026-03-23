#!/usr/bin/env python3
"""
Enhanced Senior Care Provider Discovery System — Batch Mode Fork

Supports both interactive mode (original behavior) and batch CLI mode:

  # Batch mode (no prompts):
  python3 discovery-batch.py --batch cities.csv --mode quick --auto-confirm

  # Interactive mode (original behavior):
  python3 discovery-batch.py

Batch CSV format (from map.olera.care export):
  City,StateID
  Omaha,NE
  Lincoln,NE

Output: one CSV per city in {output-dir}/{City}-{State}/
"""

import os
import argparse
import asyncio
import aiohttp
import pandas as pd
import json
import time
import re
import logging
import hashlib
import ssl
import certifi
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Set, Any
from dataclasses import dataclass, field
from collections import defaultdict
from dotenv import load_dotenv
import math
from tqdm.asyncio import tqdm
from concurrent.futures import ThreadPoolExecutor
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION CLASSES
# ============================================================================

@dataclass
class SearchConfig:
    """Enhanced configuration for comprehensive search"""
    # Core settings
    max_results_per_search: int = 20
    concurrent_requests: int = 5
    delay_between_batches: float = 1.0
    
    # Search strategies (all enabled for maximum coverage)
    enable_traditional_search: bool = True
    enable_dynamic_queries: bool = True
    enable_concentric_search: bool = True
    enable_reverse_discovery: bool = True
    enable_competitor_search: bool = True
    enable_grid_search: bool = False  # Nuclear option
    
    # Geographic parameters
    concentric_radii: List[int] = field(default_factory=lambda: [500, 1000, 2000, 5000, 10000])
    grid_spacing_miles: float = 0.5
    
    # Provider validation
    min_confidence_threshold: float = 0.3
    enable_ai_validation: bool = True
    
    # Cost controls
    max_api_calls_per_city: int = 500
    estimated_cost_per_call: float = 0.032
    
    # Output settings
    save_checkpoints: bool = True
    checkpoint_interval: int = 50

@dataclass
class ProviderInfo:
    """Structured provider information"""
    place_id: str
    name: str
    address: str
    city: str
    state: str
    zipcode: str
    lat: float
    lon: float
    phone: str = ""
    website: str = ""
    rating: float = None
    review_count: int = 0
    types: List[str] = field(default_factory=list)
    category: str = ""
    subcategory: str = ""
    discovery_method: str = ""
    confidence_score: float = 1.0
    business_status: str = ""
    price_level: int = None
    wheelchair_accessible: bool = None
    
    def to_dict(self) -> dict:
        return {
            'place_id': self.place_id,
            'provider_name': self.name,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zipcode': self.zipcode,
            'lat': self.lat,
            'lon': self.lon,
            'phone': self.phone,
            'website': self.website,
            'google_rating': self.rating,
            'review_count': self.review_count,
            'types': ','.join(self.types),
            'provider_category': self.category,
            'subcategory': self.subcategory,
            'discovery_method': self.discovery_method,
            'confidence_score': self.confidence_score,
            'business_status': self.business_status,
            'price_level': self.price_level,
            'wheelchair_accessible': self.wheelchair_accessible
        }

# ============================================================================
# COST TRACKER
# ============================================================================

class CostTracker:
    """Track API usage and costs"""
    
    def __init__(self):
        self.google_requests = 0
        self.perplexity_requests = 0
        self.start_time = time.time()
        self.requests_by_method = defaultdict(int)
        
    def add_google_request(self, method: str = "general"):
        self.google_requests += 1
        self.requests_by_method[method] += 1
        
    def add_perplexity_request(self):
        self.perplexity_requests += 1
        
    def get_current_cost(self) -> float:
        # Google Places Text Search: $32 per 1000 requests
        google_cost = (self.google_requests * 32) / 1000
        # Perplexity: ~$0.001 per request (estimate)
        perplexity_cost = self.perplexity_requests * 0.001
        return google_cost + perplexity_cost
    
    def print_summary(self):
        elapsed = time.time() - self.start_time
        cost = self.get_current_cost()
        
        print("\n" + "="*70)
        print("COST & USAGE SUMMARY")
        print("="*70)
        print(f"Total Google API Requests: {self.google_requests:,}")
        print(f"Total Perplexity Requests: {self.perplexity_requests:,}")
        print(f"Estimated Total Cost: ${cost:.2f}")
        print(f"Time Elapsed: {elapsed/60:.1f} minutes")
        print(f"\nRequests by Method:")
        for method, count in self.requests_by_method.items():
            print(f"  {method}: {count:,}")
        print("="*70)

# ============================================================================
# MAIN DISCOVERY CLASS
# ============================================================================

class EnhancedSeniorCareDiscovery:
    """Multi-strategy senior care provider discovery system"""
    
    # Comprehensive search terms for different care types
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
    
    # Known chains for competitor discovery
    KNOWN_CHAINS = [
        'Brookdale', 'Sunrise Senior Living', 'Atria Senior Living',
        'Five Star Senior Living', 'Holiday Retirement', 'Capital Senior Living',
        'Life Care Centers', 'Genesis HealthCare', 'Kindred Healthcare',
        'Encompass Health', 'Senior Lifestyle', 'Silverado', 'Belmont Village',
        'Watermark Retirement', 'Vi Living', 'Erickson Living', 'Presbyterian Homes',
        'Visiting Angels', 'Home Instead', 'Comfort Keepers', 'Right at Home',
        'Interim HealthCare', 'BrightStar Care', 'FirstLight Home Care'
    ]
    
    def __init__(self):
        """Initialize the discovery system"""
        load_dotenv()
        
        # API Keys
        self.google_api_key = os.getenv('GOOGLE_PLACES_API_KEY')
        if not self.google_api_key:
            raise ValueError("GOOGLE_PLACES_API_KEY not found in .env file")
        
        self.perplexity_api_key = os.getenv('PERPLEXITY_API_KEY')
        
        # SSL Configuration (allow override for development)
        self.verify_ssl = os.getenv('VERIFY_SSL', 'true').lower() != 'false'
        
        # API Endpoints
        self.google_base_url = "https://places.googleapis.com/v1/places:searchText"
        self.google_nearby_url = "https://places.googleapis.com/v1/places:searchNearby"
        
        # Tracking
        self.cost_tracker = CostTracker()
        self.discovered_providers: Dict[str, ProviderInfo] = {}
        self.search_cache: Dict[str, Any] = {}
        
        # Session
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        # Create SSL context
        import ssl
        import certifi
        
        if self.verify_ssl:
            # Production mode - verify SSL certificates
            ssl_context = ssl.create_default_context(cafile=certifi.where())
        else:
            # Development mode - skip SSL verification (NOT RECOMMENDED for production)
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            logger.warning("SSL verification disabled - NOT RECOMMENDED for production!")
        
        # Create connector with SSL context
        connector = aiohttp.TCPConnector(
            ssl=ssl_context,
            limit=100,  # Connection pool limit
            ttl_dns_cache=300
        )
        
        # Create session with timeout and connector
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': 'Olera-Discovery/1.0'}
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    # ========================================================================
    # CORE API METHODS
    # ========================================================================
    
    async def search_text(
        self,
        query: str,
        location_bias: Optional[Dict] = None,
        max_results: int = 20,
        rank_preference: str = "RELEVANCE"
    ) -> List[Dict]:
        """Execute Google Places text search with location bias"""
        
        # Check cache
        cache_key = f"{query}_{location_bias}_{rank_preference}"
        cache_hash = hashlib.md5(cache_key.encode()).hexdigest()
        if cache_hash in self.search_cache:
            logger.debug(f"Cache hit for query: {query}")
            return self.search_cache[cache_hash]
        
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.google_api_key,
            'X-Goog-FieldMask': (
                'places.id,places.displayName,places.formattedAddress,'
                'places.location,places.primaryType,places.types,'
                'places.nationalPhoneNumber,places.internationalPhoneNumber,'
                'places.websiteUri,places.rating,places.userRatingCount,'
                'places.businessStatus,places.priceLevel,places.accessibilityOptions,'
                'places.googleMapsUri,nextPageToken'
            )
        }
        
        payload = {
            'textQuery': query,
            'maxResultCount': max_results,
            'rankPreference': rank_preference,
            'languageCode': 'en'
        }
        
        if location_bias:
            payload['locationBias'] = location_bias
        
        all_results = []
        next_page_token = None
        pages_fetched = 0
        max_pages = 3  # Fetch up to 3 pages (60 results)
        
        while pages_fetched < max_pages:
            if next_page_token:
                payload['pageToken'] = next_page_token
            
            # Retry logic with exponential backoff
            max_retries = 3
            retry_delay = 1.0
            
            for retry in range(max_retries):
                try:
                    async with self.session.post(
                        self.google_base_url,
                        json=payload,
                        headers=headers
                    ) as response:
                        self.cost_tracker.add_google_request("text_search")
                        
                        if response.status == 200:
                            data = await response.json()
                            places = data.get('places', [])
                            all_results.extend(places)
                            
                            next_page_token = data.get('nextPageToken')
                            if not next_page_token:
                                break
                            
                            pages_fetched += 1
                            await asyncio.sleep(0.5)  # Small delay between pages
                            break  # Success, exit retry loop
                            
                        elif response.status == 429:
                            # Rate limited
                            logger.warning(f"Rate limited, waiting {retry_delay}s...")
                            await asyncio.sleep(retry_delay)
                            retry_delay *= 2
                            
                        else:
                            error_text = await response.text()
                            logger.error(f"API Error {response.status} for query '{query}': {error_text}")
                            break  # Don't retry on non-transient errors
                            
                except aiohttp.ClientSSLError as e:
                    logger.error(f"SSL Error for query '{query}': {e}")
                    logger.info("Try setting VERIFY_SSL=false in .env file for development")
                    break
                    
                except asyncio.TimeoutError:
                    logger.warning(f"Timeout for query '{query}', retry {retry + 1}/{max_retries}")
                    if retry < max_retries - 1:
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        logger.error(f"Max retries exceeded for query: {query}")
                        break
                        
                except Exception as e:
                    logger.error(f"Unexpected error for query '{query}': {e}")
                    break
            
            if not next_page_token:
                break
        
        # Cache results
        if all_results:
            self.search_cache[cache_hash] = all_results
        
        return all_results
    
    async def search_nearby(
        self,
        lat: float,
        lng: float,
        radius: int,
        included_types: Optional[List[str]] = None,
        excluded_types: Optional[List[str]] = None,
        max_results: int = 20
    ) -> List[Dict]:
        """Execute Google Places nearby search"""
        
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.google_api_key,
            'X-Goog-FieldMask': (
                'places.id,places.displayName,places.formattedAddress,'
                'places.location,places.primaryType,places.types,'
                'places.nationalPhoneNumber,places.websiteUri,places.rating,'
                'places.userRatingCount,places.businessStatus'
            )
        }
        
        payload = {
            'locationRestriction': {
                'circle': {
                    'center': {'latitude': lat, 'longitude': lng},
                    'radius': radius
                }
            },
            'maxResultCount': max_results
        }
        
        if included_types:
            payload['includedTypes'] = included_types
        if excluded_types:
            payload['excludedTypes'] = excluded_types
        
        try:
            async with self.session.post(
                self.google_nearby_url,
                json=payload,
                headers=headers
            ) as response:
                self.cost_tracker.add_google_request("nearby_search")
                
                if response.status == 200:
                    data = await response.json()
                    return data.get('places', [])
                else:
                    logger.error(f"Nearby search error: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Nearby search error: {e}")
            return []
    
    async def classify_with_ai(self, business_info: Dict) -> Tuple[bool, str, float]:
        """Use Perplexity AI to classify if a business is senior care"""
        
        if not self.perplexity_api_key:
            return False, "", 0.0
        
        prompt = f"""
        Determine if this business is a senior care provider:
        
        Name: {business_info.get('displayName', {}).get('text', 'Unknown')}
        Types: {', '.join(business_info.get('types', []))}
        Address: {business_info.get('formattedAddress', '')}
        
        Respond with JSON only:
        {{"is_senior_care": boolean, "care_type": "type_or_empty", "confidence": 0.0-1.0}}
        """
        
        headers = {
            'Authorization': f'Bearer {self.perplexity_api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': 'llama-3.1-sonar-small-128k-online',
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.1
        }
        
        try:
            async with self.session.post(
                'https://api.perplexity.ai/chat/completions',
                json=payload,
                headers=headers
            ) as response:
                self.cost_tracker.add_perplexity_request()
                
                if response.status == 200:
                    data = await response.json()
                    content = data['choices'][0]['message']['content']
                    
                    # Parse JSON response
                    import json
                    result = json.loads(content)
                    return (
                        result.get('is_senior_care', False),
                        result.get('care_type', ''),
                        result.get('confidence', 0.0)
                    )
        except Exception as e:
            logger.debug(f"AI classification error: {e}")
            
        return False, "", 0.0
    
    # ========================================================================
    # SEARCH STRATEGIES
    # ========================================================================
    
    async def strategy_traditional_search(
        self,
        city: str,
        state: str,
        care_types: List[str]
    ) -> List[ProviderInfo]:
        """Traditional category-based search"""
        
        logger.info(f"Starting traditional search for {city}, {state}")
        providers = []
        
        for care_type in care_types:
            if care_type not in self.SEARCH_PATTERNS:
                continue
                
            for search_term in self.SEARCH_PATTERNS[care_type]:
                query = f"{search_term} in {city}, {state}"
                
                results = await self.search_text(
                    query=query,
                    max_results=20,
                    rank_preference="RELEVANCE"
                )
                
                for place in results:
                    provider = self._parse_place_to_provider(place, city, state)
                    if provider:
                        provider.category = care_type
                        provider.discovery_method = "traditional_search"
                        providers.append(provider)
                
                await asyncio.sleep(0.5)  # Rate limiting
        
        logger.info(f"Traditional search found {len(providers)} providers")
        return providers
    
    async def strategy_concentric_circles(
        self,
        lat: float,
        lng: float,
        city: str,
        state: str,
        care_types: List[str],
        radii: List[int] = None
    ) -> List[ProviderInfo]:
        """Search in expanding circles from city center"""
        
        logger.info(f"Starting concentric circle search for {city}, {state}")
        
        if radii is None:
            radii = [500, 1000, 2000, 5000, 10000]
        
        providers = []
        
        for care_type in care_types:
            search_terms = self.SEARCH_PATTERNS.get(care_type, [care_type])
            
            for radius in radii:
                location_bias = {
                    'circle': {
                        'center': {'latitude': lat, 'longitude': lng},
                        'radius': radius
                    }
                }
                
                # Try multiple search terms
                for term in search_terms[:3]:  # Top 3 terms per category
                    results = await self.search_text(
                        query=term,
                        location_bias=location_bias,
                        max_results=20,
                        rank_preference="DISTANCE"
                    )
                    
                    for place in results:
                        provider = self._parse_place_to_provider(place, city, state)
                        if provider:
                            provider.category = care_type
                            provider.discovery_method = f"concentric_{radius}m"
                            providers.append(provider)
                    
                    await asyncio.sleep(0.3)
        
        logger.info(f"Concentric search found {len(providers)} providers")
        return providers
    
    async def strategy_reverse_discovery(
        self,
        lat: float,
        lng: float,
        city: str,
        state: str
    ) -> List[ProviderInfo]:
        """Find all healthcare/residential facilities and classify them"""
        
        logger.info(f"Starting reverse discovery for {city}, {state}")
        providers = []
        
        # Types that might include senior care
        potential_types = [
            'health', 'hospital', 'medical_center',
            'real_estate_agency', 'apartment_complex',
            'lodging', 'doctor', 'pharmacy'
        ]
        
        for place_type in potential_types:
            results = await self.search_nearby(
                lat=lat,
                lng=lng,
                radius=10000,
                included_types=[place_type],
                max_results=20
            )
            
            for place in results:
                # Check if name contains senior keywords
                name = place.get('displayName', {}).get('text', '').lower()
                senior_keywords = [
                    'senior', 'elderly', 'retirement', 'assisted',
                    'memory', 'alzheimer', 'dementia', 'nursing',
                    'care', 'adult', 'geriatric', 'aged'
                ]
                
                if any(keyword in name for keyword in senior_keywords):
                    provider = self._parse_place_to_provider(place, city, state)
                    if provider:
                        # Try AI classification if enabled
                        is_senior, care_type, confidence = await self.classify_with_ai(place)
                        
                        if is_senior or confidence > 0.5:
                            provider.category = care_type or "uncategorized"
                            provider.confidence_score = confidence
                            provider.discovery_method = "reverse_discovery"
                            providers.append(provider)
                        elif any(keyword in name for keyword in ['senior', 'assisted', 'nursing']):
                            # High confidence keywords
                            provider.category = "potential_senior_care"
                            provider.confidence_score = 0.7
                            provider.discovery_method = "reverse_discovery"
                            providers.append(provider)
            
            await asyncio.sleep(0.5)
        
        logger.info(f"Reverse discovery found {len(providers)} providers")
        return providers
    
    async def strategy_competitor_discovery(
        self,
        lat: float,
        lng: float,
        city: str,
        state: str
    ) -> List[ProviderInfo]:
        """Find providers by searching near known chains"""
        
        logger.info(f"Starting competitor discovery for {city}, {state}")
        providers = []
        anchor_locations = []
        
        # First, find known chain locations
        for chain in self.KNOWN_CHAINS[:10]:  # Top 10 chains
            query = f"{chain} near {city}, {state}"
            results = await self.search_text(query, max_results=5)
            
            for place in results:
                loc = place.get('location', {})
                if loc:
                    anchor_locations.append({
                        'lat': loc.get('latitude'),
                        'lng': loc.get('longitude'),
                        'chain': chain
                    })
            
            await asyncio.sleep(0.3)
        
        # Now search around each anchor location
        for anchor in anchor_locations:
            if not anchor['lat'] or not anchor['lng']:
                continue
                
            # Search for competitors nearby
            nearby_results = await self.search_text(
                query="senior care OR assisted living OR nursing home",
                location_bias={
                    'circle': {
                        'center': {
                            'latitude': anchor['lat'],
                            'longitude': anchor['lng']
                        },
                        'radius': 3000  # 3km radius
                    }
                },
                max_results=20,
                rank_preference="DISTANCE"
            )
            
            for place in nearby_results:
                provider = self._parse_place_to_provider(place, city, state)
                if provider:
                    provider.discovery_method = f"competitor_near_{anchor['chain']}"
                    providers.append(provider)
            
            await asyncio.sleep(0.5)
        
        logger.info(f"Competitor discovery found {len(providers)} providers")
        return providers
    
    async def strategy_dynamic_queries(
        self,
        city: str,
        state: str
    ) -> List[ProviderInfo]:
        """Generate dynamic, localized search queries"""
        
        logger.info(f"Starting dynamic query search for {city}, {state}")
        providers = []
        
        # Generate varied queries
        query_templates = [
            f"elderly care {city}",
            f"senior services {city} {state}",
            f"retirement homes near {city}",
            f"{city} nursing facilities",
            f"adult care homes {city}",
            f"senior housing {city} {state}",
            f"geriatric care {city}",
            f"respite care {city}",
            f"senior day care {city}",
            f"rehabilitation center {city}",
            f"long term care {city}",
            f"board and care {city}",
            f"residential care facility {city}",
            f"adult family home {city}",
            f"senior center {city}",
            f"continuing care retirement {city}"
        ]
        
        # Add neighborhood-specific searches if we have them
        neighborhoods = await self._get_neighborhoods(city, state)
        for neighborhood in neighborhoods[:5]:  # Top 5 neighborhoods
            query_templates.extend([
                f"senior care {neighborhood} {city}",
                f"assisted living {neighborhood}",
                f"nursing home near {neighborhood}"
            ])
        
        # Execute queries
        for query in query_templates:
            results = await self.search_text(query, max_results=20)
            
            for place in results:
                provider = self._parse_place_to_provider(place, city, state)
                if provider:
                    provider.discovery_method = "dynamic_query"
                    providers.append(provider)
            
            await asyncio.sleep(0.3)
        
        logger.info(f"Dynamic query search found {len(providers)} providers")
        return providers
    
    async def strategy_grid_search(
        self,
        city_bounds: Dict,
        city: str,
        state: str,
        spacing_miles: float = 0.5
    ) -> List[ProviderInfo]:
        """Nuclear option: divide city into grid and search each square"""
        
        logger.info(f"Starting grid search for {city}, {state}")
        providers = []
        
        # Calculate grid points
        grid_points = self._create_grid(
            north=city_bounds['north'],
            south=city_bounds['south'],
            east=city_bounds['east'],
            west=city_bounds['west'],
            spacing_miles=spacing_miles
        )
        
        logger.info(f"Searching {len(grid_points)} grid points...")
        
        # Search each grid point
        for i, point in enumerate(grid_points):
            if i % 10 == 0:
                logger.info(f"Grid search progress: {i}/{len(grid_points)}")
            
            results = await self.search_text(
                query="senior care OR assisted living OR nursing home",
                location_bias={
                    'circle': {
                        'center': {
                            'latitude': point[0],
                            'longitude': point[1]
                        },
                        'radius': int(spacing_miles * 1609)  # Convert miles to meters
                    }
                },
                max_results=10,
                rank_preference="DISTANCE"
            )
            
            for place in results:
                provider = self._parse_place_to_provider(place, city, state)
                if provider:
                    provider.discovery_method = f"grid_{i}"
                    providers.append(provider)
            
            await asyncio.sleep(0.5)
        
        logger.info(f"Grid search found {len(providers)} providers")
        return providers
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    def _parse_place_to_provider(
        self,
        place: Dict,
        city: str,
        state: str
    ) -> Optional[ProviderInfo]:
        """Parse Google Place result into ProviderInfo"""
        
        try:
            # Extract basic info
            place_id = place.get('id', '')
            if not place_id:
                return None
            
            display_name = place.get('displayName', {})
            name = display_name.get('text', '') if isinstance(display_name, dict) else str(display_name)
            
            if not name:
                return None
            
            # Location
            location = place.get('location', {})
            lat = location.get('latitude', 0)
            lng = location.get('longitude', 0)
            
            # Address parsing
            formatted_address = place.get('formattedAddress', '')
            address_parts = formatted_address.split(',') if formatted_address else []
            street_address = address_parts[0].strip() if address_parts else ''
            
            # Extract ZIP code
            zipcode = ''
            zip_pattern = r'\b(\d{5}(?:-\d{4})?)\b'
            if formatted_address:
                zip_match = re.search(zip_pattern, formatted_address)
                zipcode = zip_match.group(1) if zip_match else ''
            
            # Phone
            phone = (place.get('nationalPhoneNumber') or 
                    place.get('internationalPhoneNumber') or '')
            
            # Create provider
            provider = ProviderInfo(
                place_id=place_id,
                name=name,
                address=street_address,
                city=city,
                state=state,
                zipcode=zipcode,
                lat=lat,
                lon=lng,
                phone=phone,
                website=place.get('websiteUri', ''),
                rating=place.get('rating'),
                review_count=place.get('userRatingCount', 0),
                types=place.get('types', []),
                business_status=place.get('businessStatus', ''),
                price_level=place.get('priceLevel'),
                wheelchair_accessible=place.get('accessibilityOptions', {}).get('wheelchairAccessibleEntrance')
            )
            
            return provider
            
        except Exception as e:
            logger.debug(f"Error parsing place: {e}")
            return None
    
    async def _get_city_coordinates(self, city: str, state: str) -> Tuple[float, float]:
        """Get coordinates for a city"""
        
        query = f"{city}, {state}"
        results = await self.search_text(query, max_results=1)
        
        if results:
            location = results[0].get('location', {})
            return location.get('latitude', 0), location.get('longitude', 0)
        
        # Fallback coordinates for major cities
        major_cities = {
            ('New York', 'NY'): (40.7128, -74.0060),
            ('Los Angeles', 'CA'): (34.0522, -118.2437),
            ('Chicago', 'IL'): (41.8781, -87.6298),
            ('Houston', 'TX'): (29.7604, -95.3698),
            ('Phoenix', 'AZ'): (33.4484, -112.0740),
        }
        
        return major_cities.get((city, state), (39.8283, -98.5795))  # US center as default
    
    async def _get_city_bounds(self, city: str, state: str) -> Dict[str, float]:
        """Estimate city boundaries"""
        
        lat, lng = await self._get_city_coordinates(city, state)
        
        # Rough estimation (adjust based on city size)
        # This creates approximately a 20-mile box around city center
        lat_offset = 0.145  # ~10 miles
        lng_offset = 0.145
        
        return {
            'north': lat + lat_offset,
            'south': lat - lat_offset,
            'east': lng + lng_offset,
            'west': lng - lng_offset,
            'center_lat': lat,
            'center_lng': lng
        }
    
    def _create_grid(
        self,
        north: float,
        south: float,
        east: float,
        west: float,
        spacing_miles: float
    ) -> List[Tuple[float, float]]:
        """Create grid points for systematic searching"""
        
        # Convert miles to approximate degrees
        lat_spacing = spacing_miles / 69.0  # 1 degree latitude ≈ 69 miles
        
        # Longitude spacing varies by latitude
        center_lat = (north + south) / 2
        lng_spacing = spacing_miles / (69.0 * math.cos(math.radians(center_lat)))
        
        grid_points = []
        
        current_lat = south
        while current_lat <= north:
            current_lng = west
            while current_lng <= east:
                grid_points.append((current_lat, current_lng))
                current_lng += lng_spacing
            current_lat += lat_spacing
        
        return grid_points
    
    async def _get_neighborhoods(self, city: str, state: str) -> List[str]:
        """Get neighborhood names for a city (if available)"""
        
        # This would ideally query an API or database
        # For now, return empty list or could be enhanced with Perplexity
        
        if self.perplexity_api_key:
            # Could use Perplexity to get neighborhood names
            pass
        
        return []
    
    def _deduplicate_providers(self, providers: List[ProviderInfo]) -> List[ProviderInfo]:
        """Remove duplicate providers based on place_id and name/address"""
        
        seen_place_ids = set()
        seen_combinations = set()
        unique = []
        
        for provider in providers:
            # Check place_id
            if provider.place_id and provider.place_id in seen_place_ids:
                continue
            
            # Check name + address combination
            combo = f"{provider.name.lower()}|{provider.address.lower()}"
            if combo in seen_combinations and combo != "|":
                continue
            
            # Add to unique list
            if provider.place_id:
                seen_place_ids.add(provider.place_id)
            if combo != "|":
                seen_combinations.add(combo)
            
            unique.append(provider)
        
        return unique
    
    def _categorize_provider(self, provider: ProviderInfo) -> str:
        """Determine provider category based on name and types"""
        
        name_lower = provider.name.lower()
        types_str = ' '.join(provider.types).lower()
        combined = f"{name_lower} {types_str}"
        
        # Priority categorization
        if any(term in combined for term in ['memory', 'alzheimer', 'dementia']):
            return 'memory_care'
        elif any(term in combined for term in ['skilled nursing', 'snf', 'nursing home', 'nursing facility']):
            return 'nursing_home'
        elif any(term in combined for term in ['assisted living', 'alf', 'al facility']):
            return 'assisted_living'
        elif any(term in combined for term in ['independent living', 'retirement community', '55+']):
            return 'independent_living'
        elif any(term in combined for term in ['home health', 'home care', 'visiting nurse']):
            return 'home_care'
        elif any(term in combined for term in ['companion', 'non medical', 'homemaker']):
            return 'home_care_non_medical'
        else:
            return provider.category or 'uncategorized'
    
    # ========================================================================
    # MAIN DISCOVERY METHOD
    # ========================================================================
    
    async def discover_providers(
        self,
        city: str,
        state: str,
        care_types: List[str],
        config: SearchConfig
    ) -> pd.DataFrame:
        """Main method to discover all providers using multiple strategies"""
        
        logger.info(f"\n{'='*70}")
        logger.info(f"DISCOVERING PROVIDERS IN {city}, {state}")
        logger.info(f"{'='*70}")
        
        all_providers = []
        
        # Get city coordinates and bounds
        lat, lng = await self._get_city_coordinates(city, state)
        city_bounds = await self._get_city_bounds(city, state)
        
        # Strategy 1: Traditional search
        if config.enable_traditional_search:
            traditional = await self.strategy_traditional_search(city, state, care_types)
            all_providers.extend(traditional)
            logger.info(f"Total after traditional: {len(all_providers)}")
        
        # Strategy 2: Concentric circles
        if config.enable_concentric_search:
            concentric = await self.strategy_concentric_circles(
                lat, lng, city, state, care_types, config.concentric_radii
            )
            all_providers.extend(concentric)
            logger.info(f"Total after concentric: {len(all_providers)}")
        
        # Strategy 3: Reverse discovery
        if config.enable_reverse_discovery:
            reverse = await self.strategy_reverse_discovery(lat, lng, city, state)
            all_providers.extend(reverse)
            logger.info(f"Total after reverse discovery: {len(all_providers)}")
        
        # Strategy 4: Competitor discovery
        if config.enable_competitor_search:
            competitors = await self.strategy_competitor_discovery(lat, lng, city, state)
            all_providers.extend(competitors)
            logger.info(f"Total after competitor search: {len(all_providers)}")
        
        # Strategy 5: Dynamic queries
        if config.enable_dynamic_queries:
            dynamic = await self.strategy_dynamic_queries(city, state)
            all_providers.extend(dynamic)
            logger.info(f"Total after dynamic queries: {len(all_providers)}")
        
        # Strategy 6: Grid search (nuclear option)
        if config.enable_grid_search:
            grid = await self.strategy_grid_search(city_bounds, city, state, config.grid_spacing_miles)
            all_providers.extend(grid)
            logger.info(f"Total after grid search: {len(all_providers)}")
        
        # Deduplicate
        unique_providers = self._deduplicate_providers(all_providers)
        logger.info(f"Unique providers after deduplication: {len(unique_providers)}")
        
        # Final categorization
        for provider in unique_providers:
            if not provider.category or provider.category == "uncategorized":
                provider.category = self._categorize_provider(provider)
        
        # Convert to DataFrame
        provider_dicts = [p.to_dict() for p in unique_providers]
        df = pd.DataFrame(provider_dicts)
        
        # Add metadata
        df['discovery_timestamp'] = datetime.now().isoformat()
        df['search_location'] = f"{city}, {state}"
        
        return df
    
    async def run_discovery(
        self,
        locations: List[Dict[str, str]],
        care_types: List[str],
        config: Optional[SearchConfig] = None
    ) -> pd.DataFrame:
        """Run discovery for multiple locations"""
        
        if config is None:
            config = SearchConfig()
        
        all_results = []
        
        for location in locations:
            city = location.get('city', '')
            state = location.get('state', '')
            
            if not city or not state:
                logger.warning(f"Skipping invalid location: {location}")
                continue
            
            try:
                df = await self.discover_providers(city, state, care_types, config)
                all_results.append(df)
                
                # Save checkpoint
                if config.save_checkpoints:
                    checkpoint_file = f"checkpoint_{city}_{state}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                    df.to_csv(checkpoint_file, index=False)
                    logger.info(f"Checkpoint saved: {checkpoint_file}")
                
            except Exception as e:
                logger.error(f"Error discovering providers in {city}, {state}: {e}")
                continue
        
        # Combine all results
        if all_results:
            final_df = pd.concat(all_results, ignore_index=True)
            
            # Final deduplication across all cities
            final_df = final_df.drop_duplicates(subset=['place_id'], keep='first')
            
            return final_df
        else:
            return pd.DataFrame()

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def parse_batch_csv(csv_path: str) -> List[Dict[str, str]]:
    """Parse a batch CSV file (City,StateID format from map.olera.care)"""
    locations = []
    with open(csv_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('City') or line.startswith('#'):
                continue
            parts = line.split(',')
            if len(parts) >= 2:
                city = parts[0].strip()
                state = parts[1].strip().upper()
                if city and state and len(state) == 2:
                    locations.append({'city': city, 'state': state})
    return locations


def parse_batch_md(md_path: str) -> List[Dict[str, str]]:
    """Parse a .md batch file exported from map.olera.care.
    Looks for the machine-readable block fenced with ```batch-cities or
    falls back to any CSV-like lines at the bottom of the file."""
    content = open(md_path, 'r').read()

    # Try to find fenced batch-cities block
    import re as _re
    match = _re.search(r'```(?:batch-cities)?\s*\n([\s\S]*?)```', content)
    if match:
        block = match.group(1)
    else:
        # Fallback: grab everything after "Machine-Readable" heading
        idx = content.find('Machine-Readable')
        block = content[idx:] if idx != -1 else content

    locations = []
    for line in block.strip().splitlines():
        line = line.strip()
        if not line or line.startswith('City') or line.startswith('#') or line.startswith('|'):
            continue
        parts = line.split(',')
        if len(parts) >= 2:
            city = parts[0].strip()
            state = parts[1].strip().upper()
            if city and state and len(state) == 2:
                locations.append({'city': city, 'state': state})
    return locations


def get_search_config(mode: str) -> SearchConfig:
    """Return a SearchConfig for the given mode name."""
    if mode == 'quick':
        return SearchConfig(
            enable_traditional_search=True,
            enable_dynamic_queries=False,
            enable_concentric_search=False,
            enable_reverse_discovery=False,
            enable_competitor_search=False,
            enable_grid_search=False
        )
    elif mode == 'comprehensive':
        return SearchConfig(
            enable_traditional_search=True,
            enable_dynamic_queries=True,
            enable_concentric_search=True,
            enable_reverse_discovery=True,
            enable_competitor_search=True,
            enable_grid_search=False
        )
    elif mode == 'nuclear':
        return SearchConfig(
            enable_traditional_search=True,
            enable_dynamic_queries=True,
            enable_concentric_search=True,
            enable_reverse_discovery=True,
            enable_competitor_search=True,
            enable_grid_search=True,
            grid_spacing_miles=0.3
        )
    else:
        # Standard
        return SearchConfig(
            enable_traditional_search=True,
            enable_dynamic_queries=True,
            enable_concentric_search=True,
            enable_reverse_discovery=False,
            enable_competitor_search=False,
            enable_grid_search=False
        )


def estimate_cost(num_cities: int, num_care_types: int, config: SearchConfig) -> tuple:
    """Return (estimated_calls, estimated_cost_usd)."""
    calls = num_cities * num_care_types * 20
    if config.enable_concentric_search:
        calls *= 2
    if config.enable_grid_search:
        calls *= 5
    cost = (calls * 32) / 1000
    return calls, cost


def format_duration(seconds: float) -> str:
    """Format seconds into a human-readable string."""
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        return f"{seconds/60:.1f}m"
    else:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        return f"{h}h{m}m"


# ============================================================================
# BATCH MODE
# ============================================================================

async def run_batch(args):
    """Run discovery in batch mode — no prompts, one CSV per city."""

    # Parse locations
    batch_path = args.batch
    if batch_path.endswith('.md'):
        locations = parse_batch_md(batch_path)
    else:
        locations = parse_batch_csv(batch_path)

    if not locations:
        print("ERROR: No valid locations found in batch file.")
        return

    # Care types
    all_care_types = [
        'assisted_living', 'memory_care', 'nursing_home',
        'home_care', 'home_care_non_medical', 'independent_living'
    ]
    if args.care_types == 'all':
        care_types = all_care_types
    else:
        care_types = [ct.strip() for ct in args.care_types.split(',')]

    # Search config
    config = get_search_config(args.mode)

    # Cost estimate
    est_calls, est_cost = estimate_cost(len(locations), len(care_types), config)
    est_time_min = len(locations) * 2.5  # ~2.5 min per city in quick mode

    print("\n" + "=" * 70)
    print("BATCH DISCOVERY")
    print("=" * 70)
    print(f"  Cities:       {len(locations)}")
    print(f"  Mode:         {args.mode}")
    print(f"  Care types:   {len(care_types)} ({', '.join(care_types)})")
    print(f"  Est. calls:   {est_calls:,}")
    print(f"  Est. cost:    ${est_cost:.2f}")
    print(f"  Est. time:    {format_duration(est_time_min * 60)}")
    print(f"  Output dir:   {args.output_dir}")
    print()

    if est_time_min > 60:
        print(f"  ⚠️  This will take ~{format_duration(est_time_min * 60)}. "
              f"Consider running in background or splitting into smaller batches.")
        print()

    if not args.auto_confirm:
        confirm = input(f"Continue with {len(locations)} cities? (y/n): ").strip().lower()
        if confirm != 'y':
            print("Cancelled.")
            return

    # Ensure output dir exists
    os.makedirs(args.output_dir, exist_ok=True)

    # Track results
    results_summary = []
    total_providers = 0
    total_cost = 0.0
    batch_start = time.time()
    failed_cities = []

    async with EnhancedSeniorCareDiscovery() as discovery:
        for i, loc in enumerate(locations):
            city = loc['city']
            state = loc['state']
            city_dir = os.path.join(args.output_dir, f"{city}-{state}")
            os.makedirs(city_dir, exist_ok=True)

            # Check if already discovered (idempotent)
            existing_csvs = [f for f in os.listdir(city_dir) if f.startswith('providers_discovered_')]
            if existing_csvs and not args.force:
                print(f"  [{i+1}/{len(locations)}] {city}, {state} — SKIP (already discovered: {existing_csvs[0]})")
                results_summary.append({
                    'city': city, 'state': state, 'status': 'skipped',
                    'providers': 0, 'cost': 0, 'duration': 0
                })
                continue

            city_start = time.time()
            print(f"  [{i+1}/{len(locations)}] {city}, {state} — discovering...", end='', flush=True)

            # Reset cost tracker for per-city tracking
            city_cost_before = discovery.cost_tracker.get_current_cost()

            try:
                df = await discovery.discover_providers(city, state, care_types, config)

                # Save per-city CSV
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                output_file = os.path.join(city_dir, f"providers_discovered_{timestamp}.csv")
                df.to_csv(output_file, index=False)

                city_elapsed = time.time() - city_start
                city_cost = discovery.cost_tracker.get_current_cost() - city_cost_before
                num_providers = len(df)
                total_providers += num_providers
                total_cost += city_cost

                print(f" {num_providers} providers (${city_cost:.2f}, {format_duration(city_elapsed)})")

                # Category breakdown
                if len(df) > 0:
                    cats = df['provider_category'].value_counts()
                    cat_str = ', '.join(f"{cat}: {cnt}" for cat, cnt in cats.items())
                    print(f"           {cat_str}")

                results_summary.append({
                    'city': city, 'state': state, 'status': 'complete',
                    'providers': num_providers, 'cost': city_cost,
                    'duration': city_elapsed
                })

            except Exception as e:
                city_elapsed = time.time() - city_start
                print(f" FAILED ({e})")
                logger.error(f"Discovery failed for {city}, {state}: {e}")
                failed_cities.append({'city': city, 'state': state, 'error': str(e)})
                results_summary.append({
                    'city': city, 'state': state, 'status': 'failed',
                    'providers': 0, 'cost': 0, 'duration': city_elapsed
                })
                continue

    # Final summary
    batch_elapsed = time.time() - batch_start
    completed = [r for r in results_summary if r['status'] == 'complete']
    skipped = [r for r in results_summary if r['status'] == 'skipped']

    print("\n" + "=" * 70)
    print("BATCH DISCOVERY COMPLETE")
    print("=" * 70)
    print(f"  Completed:    {len(completed)}/{len(locations)} cities")
    if skipped:
        print(f"  Skipped:      {len(skipped)} (already discovered)")
    if failed_cities:
        print(f"  Failed:       {len(failed_cities)}")
        for f in failed_cities:
            print(f"    - {f['city']}, {f['state']}: {f['error']}")
    print(f"  Total providers: {total_providers:,}")
    print(f"  Total cost:   ${total_cost:.2f}")
    print(f"  Total time:   {format_duration(batch_elapsed)}")
    print(f"  Output:       {args.output_dir}")
    print("=" * 70)


# ============================================================================
# INTERACTIVE MODE (original behavior)
# ============================================================================

async def run_interactive():
    """Original interactive mode — prompts for input."""

    print("\n" + "="*70)
    print("ENHANCED SENIOR CARE PROVIDER DISCOVERY SYSTEM")
    print("="*70)

    print("\nLocation Input Options:")
    print("1. Enter cities manually")
    print("2. Load from CSV file")

    choice = input("\nSelect option (1 or 2): ").strip()

    locations = []

    if choice == "2":
        csv_path = input("Enter CSV file path: ").strip()
        try:
            df = pd.read_csv(csv_path)
            for _, row in df.iterrows():
                locations.append({
                    'city': str(row.get('city', '')).strip(),
                    'state': str(row.get('state', '')).strip()
                })
            print(f"Loaded {len(locations)} locations from CSV")
        except Exception as e:
            print(f"Error loading CSV: {e}")
            return
    else:
        while True:
            city = input("\nEnter city name (or 'done' to finish): ").strip()
            if city.lower() == 'done':
                break
            state = input("Enter state abbreviation: ").strip().upper()
            locations.append({'city': city, 'state': state})

    if not locations:
        print("No locations provided. Exiting.")
        return

    # Select care types
    print("\nSelect care types to search for:")
    care_type_options = [
        'assisted_living', 'memory_care', 'nursing_home',
        'home_care', 'home_care_non_medical', 'independent_living'
    ]

    print("Available types:")
    for i, ct in enumerate(care_type_options, 1):
        print(f"{i}. {ct.replace('_', ' ').title()}")
    print(f"{len(care_type_options) + 1}. All types")

    selection = input("\nEnter numbers separated by commas (e.g., 1,2,3): ").strip()

    if str(len(care_type_options) + 1) in selection:
        care_types = care_type_options
    else:
        indices = [int(x.strip()) - 1 for x in selection.split(',') if x.strip().isdigit()]
        care_types = [care_type_options[i] for i in indices if 0 <= i < len(care_type_options)]

    if not care_types:
        care_types = care_type_options

    print(f"\nSelected care types: {', '.join(care_types)}")

    # Configure search
    print("\nSearch Configuration:")
    print("1. Quick search (fewer API calls, may miss some providers)")
    print("2. Standard search (balanced)")
    print("3. Comprehensive search (maximum coverage, higher cost)")
    print("4. Nuclear option (grid search, very high cost)")

    config_choice = input("\nSelect configuration (1-4): ").strip()
    mode_map = {'1': 'quick', '3': 'comprehensive', '4': 'nuclear'}
    config = get_search_config(mode_map.get(config_choice, 'standard'))

    # Estimate cost
    est_calls, est_cost = estimate_cost(len(locations), len(care_types), config)

    print(f"\n⚠️  ESTIMATED COST: ${est_cost:.2f} ({est_calls:,} API calls)")
    confirm = input("Continue? (y/n): ").strip().lower()

    if confirm != 'y':
        print("Discovery cancelled.")
        return

    # Run discovery
    async with EnhancedSeniorCareDiscovery() as discovery:
        print("\n🚀 Starting discovery...")
        start_time = time.time()

        try:
            results_df = await discovery.run_discovery(locations, care_types, config)

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"providers_discovered_{timestamp}.csv"
            results_df.to_csv(output_file, index=False)

            elapsed = time.time() - start_time

            print("\n" + "="*70)
            print("DISCOVERY COMPLETE!")
            print("="*70)
            print(f"\n📊 Results Summary:")
            print(f"  Total providers found: {len(results_df):,}")
            print(f"  Unique place IDs: {results_df['place_id'].nunique():,}")
            print(f"  Time elapsed: {elapsed/60:.1f} minutes")
            print(f"  Results saved to: {output_file}")

            if len(results_df) > 0:
                print(f"\n📈 Breakdown by category:")
                category_counts = results_df['provider_category'].value_counts()
                for category, count in category_counts.items():
                    print(f"  {category}: {count:,}")

                print(f"\n🔍 Discovery methods used:")
                method_counts = results_df['discovery_method'].value_counts()
                for method, count in method_counts.head(10).items():
                    print(f"  {method}: {count:,}")

            discovery.cost_tracker.print_summary()

        except Exception as e:
            logger.error(f"Discovery failed: {e}")
            print(f"\n❌ Error: {e}")


# ============================================================================
# CLI ENTRY POINT
# ============================================================================

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description='Senior Care Provider Discovery — Interactive or Batch Mode',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode (original behavior):
  python3 discovery-batch.py

  # Batch mode with auto-confirm:
  python3 discovery-batch.py --batch cities.csv --mode quick --auto-confirm

  # Batch from .md export (map.olera.care):
  python3 discovery-batch.py --batch expansion-batch-2026-03-23.md --mode quick --auto-confirm

  # Custom output directory:
  python3 discovery-batch.py --batch cities.csv --output-dir /tmp/discovery-test
        """
    )
    parser.add_argument('--batch', type=str, default=None,
                        help='Path to batch CSV or .md file (enables batch mode)')
    parser.add_argument('--mode', type=str, default='quick',
                        choices=['quick', 'standard', 'comprehensive', 'nuclear'],
                        help='Search mode (default: quick)')
    parser.add_argument('--auto-confirm', action='store_true',
                        help='Skip cost confirmation prompt')
    parser.add_argument('--output-dir', type=str,
                        default=os.path.expanduser('~/Desktop/TJ-hq/Olera/Provider Database/Expansion'),
                        help='Base output directory for per-city CSVs')
    parser.add_argument('--care-types', type=str, default='all',
                        help='Comma-separated care types or "all" (default: all)')
    parser.add_argument('--force', action='store_true',
                        help='Re-discover cities that already have CSVs')
    return parser


if __name__ == "__main__":
    parser = build_parser()
    args = parser.parse_args()

    if args.batch:
        asyncio.run(run_batch(args))
    else:
        asyncio.run(run_interactive())