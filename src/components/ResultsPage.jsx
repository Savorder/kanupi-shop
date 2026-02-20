/**
 * ResultsPage — Kayak-style parts results with margin columns.
 * 
 * WIRED to the real /api/parts/search endpoint on kanupi-backend.
 * Enriches results with shop margin rules from ShopContext.
 * 
 * URL params:
 *   Single-part:
 *     ?q=brake+pads&year=2019&make=Honda&model=Accord&vin=...
 *     ?marcus=grinding+noise+from+front+brakes
 *   Multi-part (from RelatedPartsDrawer):
 *     ?q=front+struts&parts=["front+struts","rear+shocks","strut+mounts"]
 *       &labels=["Front Struts","Rear Shocks","Strut Mounts"]
 *       &year=2019&make=Honda&model=Accord
 * 
 * Flow:
 *   1. Parse URL params for query + vehicle context
 *   2a. Single-part: Call /api/parts/search with query + vehicle
 *   2b. Multi-part: Run parallel /api/parts/search for each part
 *   3. Map API response to B2B result format
 *   4. Enrich each result with margin calculations from shop rules
 *   5. Apply client-side filters + sort
 *   6. Render FilterSidebar + SortTabs + ResultRow grid (with group dividers for multi-part)
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { enrichPartWithMargin } from '../utils/marginCalculator';
import API from '../config/api';
import FilterSidebar from './FilterSidebar';
import SortTabs from './SortTabs';
import ResultRow from './ResultRow';

const DEFAULT_FILTERS = {
  brands: [],
  vendors: [],
  materials: [],
  tiers: [],
  priceMin: 0,
  priceMax: 999,
  inStockOnly: false,
};

/**
 * Known brands for extraction from titles when brand field is missing.
 * Sorted longest-first so "Power Stop" matches before "Stop".
 */
const KNOWN_BRANDS = [
  'Power Stop', 'ACDelco', 'StopTech', 'Royal Purple', 'Mobil 1',
  'Akebono', 'Brembo', 'Wagner', 'Bosch', 'Centric', 'EBC', 'Hawk',
  'Monroe', 'Bilstein', 'KYB', 'Moog', 'Dorman', 'Denso', 'NGK',
  'Motorcraft', 'Duralast', 'Valucraft', 'Raybestos', 'Bendix',
  'TRW', 'ATE', 'Textar', 'Ferodo', 'Continental', 'Gates', 'Dayco',
  'WIX', 'Fram', 'K&N', 'Purolator', 'Castrol', 'Pennzoil',
  'NTK', 'Delphi', 'AC Delco', 'Beck Arnley', 'Cardone',
].sort((a, b) => b.length - a.length);

/**
 * Map a raw API result into the B2B result format that ResultRow expects.
 * Handles both the unified-result schema and transformResultForFrontend format.
 * Optionally tags with _groupLabel for multi-part grouped display.
 */
function mapApiResult(raw, index, groupLabel) {
  const price = raw.price || raw.totalPrice || 0;
  const brand = raw.brand || extractBrandFromTitle(raw.title || raw.name || '') || 'Unknown';
  const partNumber = raw.partNumber || raw.part_number || '';
  const title = raw.title || raw.name || 'Auto Part';
  const imageUrl = raw.imageUrl || raw.image || raw.thumbnailUrl || null;
  const shippingDays = raw.shipping?.estimatedDays ?? raw.shippingDays ?? null;
  const freeShipping = raw.shipping?.freeShipping || raw.freeShipping || false;

  let deliveryHours = 72;
  if (shippingDays !== null && shippingDays !== undefined) {
    deliveryHours = Math.max(shippingDays, 1) * 24;
  } else if (freeShipping) {
    deliveryHours = 48;
  }

  let fitment = 'unknown';
  if (raw.fitmentVerified === true || raw.fitment_verified === true) {
    fitment = 'verified';
  } else if (raw.fitmentConfidence === 'high' || raw.fitmentConfidence === 'medium') {
    fitment = 'likely';
  }

  let tier = 'better';
  const rawTier = raw.qualityTier || raw.quality_tier || raw.tier || '';
  if (rawTier === 'best' || rawTier === 'premium') tier = 'best';
  else if (rawTier === 'good' || rawTier === 'economy') tier = 'good';
  else if (rawTier === 'better' || rawTier === 'quality') tier = 'better';

  const source = raw.source || raw.retailer || 'eBay';

  return {
    id: raw.id || raw.sourceItemId || raw.sourceId || `result-${groupLabel || 'single'}-${index}`,
    partName: cleanTitle(title, brand),
    brand,
    partNumber,
    material: detectMaterial(title),
    tier,
    vendor: mapSourceToVendor(source),
    cost: price,
    deliveryHours,
    fitment,
    imageUrl,
    condition: raw.condition || 'new',
    sourceUrl: raw.url || raw.itemUrl || raw.affiliateUrl || null,
    affiliateUrl: raw.affiliateUrl || raw.url || null,
    marcusScore: raw.relevanceScore || 50,
    marcusReason: null,
    _groupLabel: groupLabel || null,
  };
}

function extractBrandFromTitle(title) {
  const titleLower = title.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (titleLower.includes(brand.toLowerCase())) return brand;
  }
  return null;
}

function detectMaterial(title) {
  const lower = title.toLowerCase();
  if (lower.includes('ceramic')) return 'Ceramic';
  if (lower.includes('semi-metallic') || lower.includes('semi metallic')) return 'Semi-Metallic';
  if (lower.includes('organic')) return 'Organic';
  if (lower.includes('carbon fiber')) return 'Carbon Fiber';
  return null;
}

function mapSourceToVendor(source) {
  const map = {
    'ebay': 'eBay', 'amazon': 'Amazon', 'autozone': 'AutoZone Pro',
    'oreilly': "O'Reilly Pro", 'napa': 'NAPA', 'advance': 'Advance Auto',
    'rockauto': 'RockAuto', 'worldpac': 'WorldPac',
  };
  return map[source?.toLowerCase()] || source || 'eBay';
}

function cleanTitle(title, brand) {
  let clean = title;
  if (brand && clean.toLowerCase().startsWith(brand.toLowerCase())) {
    clean = clean.slice(brand.length).trim();
    if (clean.startsWith('-') || clean.startsWith('–') || clean.startsWith(',')) {
      clean = clean.slice(1).trim();
    }
  }
  if (clean.length > 80) clean = clean.slice(0, 77) + '...';
  return clean || title;
}

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { shop, marginRules, excludedBrands, session } = useShop();
  const accentColor = shop?.accent_color || '#dc2626';

  const query = searchParams.get('q') || searchParams.get('marcus') || '';
  const isMarcusSearch = !!searchParams.get('marcus');
  const year = searchParams.get('year');
  const make = searchParams.get('make');
  const model = searchParams.get('model');
  const vin = searchParams.get('vin');
  const partsParam = searchParams.get('parts');
  const vehicleLabel = year && make && model ? `${year} ${make} ${model}` : null;

  // ── Multi-part params from RelatedPartsDrawer ───────────────────
  const partsParam = searchParams.get('parts');
  const labelsParam = searchParams.get('labels');
  const isMultiPart = !!partsParam;

  let partQueries = [];
  let partLabels = [];
  if (isMultiPart) {
    try {
      partQueries = JSON.parse(partsParam);
      partLabels = JSON.parse(labelsParam || '[]');
    } catch {
      partQueries = [];
      partLabels = [];
    }
  }

  // Display label: multi-part shows all labels joined, single shows query
  const headerLabel = isMultiPart && partLabels.length > 0
    ? partLabels.join(' + ')
    : query;

  const [rawResults, setRawResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTime, setSearchTime] = useState(null);
  const [sortBy, setSortBy] = useState(isMarcusSearch ? 'marcus_pick' : 'best_margin');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [smartFilterActive, setSmartFilterActive] = useState(false);
  const [smartFilterText, setSmartFilterText] = useState('');
  const [partGroups, setPartGroups] = useState([]);

  // ── Fetch results from API ────────────────────────────────────
  useEffect(() => {
    if (!query && !isMultiPart) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    /**
     * Build a search URL for a single part query.
     */
    const buildSearchUrl = (partQuery) => {
      const params = new URLSearchParams({ query: partQuery });
      if (year) params.set('year', year);
      if (make) params.set('make', make);
      if (model) params.set('model', model);
      if (vin) params.set('vin', vin);
      params.set('limit', '20');
      params.set('condition', 'new');
      return `${API.parts.search()}?${params.toString()}`;
    };

    /**
     * Fetch results for a single part query and tag each result with the group label.
     */
    const fetchSinglePart = async (partQuery, label) => {
      const url = buildSearchUrl(partQuery);
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Search failed for "${label}" (${response.status})`);
      const data = await response.json();

      let results = [];
      if (data.parts && Array.isArray(data.parts)) results = data.parts;
      else if (data.results && Array.isArray(data.results)) results = data.results;
      else if (data.data && Array.isArray(data.data)) results = data.data;

      return results.map((raw, i) => mapApiResult(raw, i, label));
    };

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      const startTime = Date.now();

      try {
        let allMapped = [];
        let groups = [];

        if (isMultiPart && partQueries.length > 0) {
          // ── Multi-part: parallel searches for each part ──────────
          const searchPairs = partQueries.map((q, i) => ({
            query: q,
            label: partLabels[i] || q,
          }));

          const results = await Promise.allSettled(
            searchPairs.map((pair) => fetchSinglePart(pair.query, pair.label))
          );

          results.forEach((result, i) => {
            const label = searchPairs[i].label;
            if (result.status === 'fulfilled' && result.value.length > 0) {
              allMapped.push(...result.value);
              groups.push({ label, count: result.value.length });
            } else {
              groups.push({ label, count: 0, error: result.reason?.message || null });
            }
          });
        } else {
          // ── Single-part: original behavior ──────────────────────
          const url = buildSearchUrl(query);
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`Search failed (${response.status})`);
          const data = await response.json();

          let results = [];
          if (data.parts && Array.isArray(data.parts)) results = data.parts;
          else if (data.results && Array.isArray(data.results)) results = data.results;
          else if (data.data && Array.isArray(data.data)) results = data.data;

          allMapped = results.map((raw, i) => mapApiResult(raw, i, null));
        }

        setSearchTime(Date.now() - startTime);
        setPartGroups(groups);

        // Remove shop's excluded brands
        const filtered = excludedBrands.length > 0
          ? allMapped.filter((p) => !excludedBrands.includes(p.brand))
          : allMapped;

        setRawResults(filtered);
        // Log search to history (fire-and-forget)
        const token = session?.access_token;
        if (token && !isMarcusSearch) {
          const searchesToLog = isMultiPart && partQueries.length > 0
            ? partQueries.map((q, i) => ({ search_type: 'part', query: partLabels[i] || q, vehicle_context: vehicleLabel ? { year, make, model, vin } : null, results_count: filtered.filter(p => p._groupLabel === (partLabels[i] || q)).length }))
            : [{ search_type: 'part', query, vehicle_context: vehicleLabel ? { year, make, model, vin } : null, results_count: filtered.length }];

          searchesToLog.forEach((entry) => {
            fetch(API.b2b.searchHistory(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(entry),
            }).catch(() => {});
          });
        } else if (token && isMarcusSearch) {
          fetch(API.b2b.searchHistory(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ search_type: 'marcus', query, vehicle_context: vehicleLabel ? { year, make, model, vin } : null, results_count: filtered.length }),
          }).catch(() => {});
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[ResultsPage] Search error:', err);
          setError(err.message || 'Search failed');
          setRawResults([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    return () => controller.abort();
  }, [query, year, make, model, vin, excludedBrands, isMultiPart, partsParam, labelsParam]);

  // ── Enrich with margin calculations ───────────────────────────
  const enrichedResults = useMemo(() => {
    return rawResults.map((part) => enrichPartWithMargin(part, marginRules, part.partType));
  }, [rawResults, marginRules]);

  // ── Derive available filter options ───────────────────────────
  const availableBrands = useMemo(() => [...new Set(enrichedResults.map((p) => p.brand))].sort(), [enrichedResults]);
  const availableVendors = useMemo(() => [...new Set(enrichedResults.map((p) => p.vendor))].sort(), [enrichedResults]);
  const availableMaterials = useMemo(() => [...new Set(enrichedResults.map((p) => p.material).filter(Boolean))].sort(), [enrichedResults]);

  const brandCounts = useMemo(() => {
    const c = {};
    enrichedResults.forEach((p) => { c[p.brand] = (c[p.brand] || 0) + 1; });
    return c;
  }, [enrichedResults]);

  const vendorCounts = useMemo(() => {
    const c = {};
    enrichedResults.forEach((p) => { c[p.vendor] = (c[p.vendor] || 0) + 1; });
    return c;
  }, [enrichedResults]);

  // ── Filter results ────────────────────────────────────────────
  const filteredResults = useMemo(() => {
    return enrichedResults.filter((part) => {
      if (filters.brands.length > 0 && !filters.brands.includes(part.brand)) return false;
      if (filters.vendors.length > 0 && !filters.vendors.includes(part.vendor)) return false;
      if (filters.materials.length > 0 && !filters.materials.includes(part.material)) return false;
      if (filters.tiers.length > 0 && !filters.tiers.includes(part.tier)) return false;
      if (filters.priceMin > 0 && part.cost < filters.priceMin) return false;
      if (filters.priceMax < 999 && part.cost > filters.priceMax) return false;
      if (filters.inStockOnly && part.deliveryHours > 24) return false;
      return true;
    });
  }, [enrichedResults, filters]);

  // ── Sort results ──────────────────────────────────────────────
  // For multi-part: sort WITHIN each group to keep groups visually together
  const sortedResults = useMemo(() => {
    const sorter = (a, b) => {
      switch (sortBy) {
        case 'best_margin': return (b.margin || 0) - (a.margin || 0);
        case 'lowest_cost': return a.cost - b.cost;
        case 'fastest_delivery': return a.deliveryHours - b.deliveryHours;
        case 'marcus_pick': return (b.marcusScore || 0) - (a.marcusScore || 0);
        default: return 0;
      }
    };

    if (isMultiPart && partGroups.length > 0) {
      // Keep group order intact, sort within each group
      const grouped = [];
      for (const group of partGroups) {
        const groupItems = filteredResults
          .filter((p) => p._groupLabel === group.label)
          .sort(sorter);
        grouped.push(...groupItems);
      }
      return grouped;
    }

    return [...filteredResults].sort(sorter);
  }, [filteredResults, sortBy, isMultiPart, partGroups]);

  const marcusPickId = sortBy === 'marcus_pick' && sortedResults.length > 0 ? sortedResults[0].id : null;

  // ── Selection handlers ────────────────────────────────────────
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAddToOrder = useCallback(async (part) => {
    try {
      const token = session?.access_token;
      if (!token) {
        alert('Session expired. Please sign in again.');
        return;
      }

      const response = await fetch(API.b2b.orders(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_context: vehicleLabel ? { year, make, model } : null,
          part_name: part.partName,
          part_number: part.partNumber || null,
          brand: part.brand,
          vendor: part.vendor,
          cost: part.cost,
          list_price: part.listPrice,
          source: part.vendor?.toLowerCase() === 'ebay' ? 'ebay' : 'other',
          source_url: part.affiliateUrl || part.sourceUrl || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create order');

      alert(`✓ Added: ${part.brand} ${part.partName}\nCost: $${part.cost.toFixed(2)} → List: $${part.listPrice.toFixed(2)} → Margin: +$${part.margin.toFixed(2)}`);
    } catch (err) {
      console.error('[ResultsPage] Add to order error:', err);
      alert('Failed to add to order. Please try again.');
    }
  }, [session, vehicleLabel, year, make, model]);

  const handleBulkAddToOrder = useCallback(() => {
    const selected = sortedResults.filter((p) => selectedIds.has(p.id));
    selected.forEach((part) => handleAddToOrder(part));
    setSelectedIds(new Set());
  }, [sortedResults, selectedIds, handleAddToOrder]);

  // ── Smart Filter handlers ─────────────────────────────────────
  const handleSmartFilterApply = useCallback((parsed, text) => {
    const newFilters = { ...DEFAULT_FILTERS };
    if (parsed.brands.length > 0) newFilters.brands = parsed.brands;
    if (parsed.vendors.length > 0) newFilters.vendors = parsed.vendors;
    if (parsed.materials.length > 0) newFilters.materials = parsed.materials;
    if (parsed.tiers.length > 0) newFilters.tiers = parsed.tiers;
    if (parsed.priceMax !== null) newFilters.priceMax = parsed.priceMax;
    if (parsed.priceMin !== null) newFilters.priceMin = parsed.priceMin;
    if (parsed.inStockOnly) newFilters.inStockOnly = true;
    setFilters(newFilters);
    setSmartFilterActive(true);
    setSmartFilterText(text);
  }, []);

  const handleSmartFilterClear = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSmartFilterActive(false);
    setSmartFilterText('');
  }, []);

  // ── Helper: render rows with group dividers for multi-part ────
  const renderResultRows = () => {
    if (!isMultiPart || partGroups.length === 0) {
      return sortedResults.map((part) => (
        <ResultRow
          key={part.id}
          part={part}
          isSelected={selectedIds.has(part.id)}
          onSelect={toggleSelect}
          isMarcusPick={part.id === marcusPickId}
          showMarcusBanner={sortBy === 'marcus_pick'}
          onAddToOrder={handleAddToOrder}
        />
      ));
    }

    // Multi-part: insert group headers between sections
    const rows = [];
    let lastGroup = null;

    for (const part of sortedResults) {
      const groupLabel = part._groupLabel || 'Other';

      if (groupLabel !== lastGroup) {
        const groupCount = sortedResults.filter((p) => p._groupLabel === groupLabel).length;
        const groupInfo = partGroups.find((g) => g.label === groupLabel);

        rows.push(
          <div
            key={`group-header-${groupLabel}`}
            className="px-5 py-2.5 bg-gray-50 border-b border-t border-gray-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                {groupLabel}
              </span>
              <span className="text-[10px] text-gray-400">
                {groupCount} result{groupCount !== 1 ? 's' : ''}
              </span>
            </div>
            {groupInfo?.error && (
              <span className="text-[10px] text-amber-500">⚠ Search issue</span>
            )}
          </div>
        );
        lastGroup = groupLabel;
      }

      rows.push(
        <ResultRow
          key={part.id}
          part={part}
          isSelected={selectedIds.has(part.id)}
          onSelect={toggleSelect}
          isMarcusPick={part.id === marcusPickId}
          showMarcusBanner={sortBy === 'marcus_pick'}
          onAddToOrder={handleAddToOrder}
        />
      );
    }

    return rows;
  };

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto">
        <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">{headerLabel}</h1>
            {vehicleLabel && <p className="text-xs text-gray-400">for {vehicleLabel}</p>}
          </div>
        </div>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500 font-medium">
              {isMultiPart ? `Searching ${partQueries.length} parts...` : 'Searching parts...'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isMultiPart
                ? partLabels.join(', ')
                : 'Checking eBay, Amazon, and local suppliers'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-screen-2xl mx-auto">
        <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-900">{headerLabel}</h1>
        </div>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Search failed</h3>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors"
              style={{ background: accentColor }}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto">
      {/* Search context bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900">{headerLabel}</h1>
              {isMarcusSearch && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium">🤖 Marcus</span>
              )}
              {isMultiPart && (
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">
                  {partQueries.length} parts
                </span>
              )}
            </div>
            {vehicleLabel && (
              <p className="text-xs text-gray-400">
                for <span className="font-medium text-gray-600">{vehicleLabel}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {searchTime && (
            <span className="text-[11px] text-gray-300">{(searchTime / 1000).toFixed(1)}s</span>
          )}
          {sortedResults.length > 0 && (
            <div className="text-right">
              <div className="text-[10px] text-gray-400">Avg margin on page</div>
              <div className="text-sm font-bold text-green-600 font-mono">
                {(sortedResults.reduce((sum, p) => sum + p.marginPct, 0) / sortedResults.length).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-part summary banner — shows status dots for each part searched */}
      {isMultiPart && partGroups.length > 0 && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-4 overflow-x-auto">
          {partGroups.map((group) => (
            <div key={group.label} className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`w-2 h-2 rounded-full ${group.count > 0 ? 'bg-green-400' : 'bg-gray-300'}`} />
              <span className="text-[11px] text-gray-600 font-medium">{group.label}</span>
              <span className="text-[10px] text-gray-400">({group.count})</span>
            </div>
          ))}
        </div>
      )}

      {/* Main layout */}
      <div className="flex">
        <FilterSidebar
          filters={filters}
          onFilterChange={setFilters}
          availableBrands={availableBrands}
          availableVendors={availableVendors}
          availableMaterials={availableMaterials}
          brandCounts={brandCounts}
          vendorCounts={vendorCounts}
          onSmartFilterApply={handleSmartFilterApply}
          onSmartFilterClear={handleSmartFilterClear}
          smartFilterActive={smartFilterActive}
          smartFilterText={smartFilterText}
        />

        <div className="flex-1 min-w-0">
          <SortTabs
            sortBy={sortBy}
            onSortChange={setSortBy}
            resultCount={sortedResults.length}
            totalCount={enrichedResults.length}
            selectedCount={selectedIds.size}
            onAddToOrder={handleBulkAddToOrder}
          />

          {/* Column headers */}
          <div className="px-5 py-2 flex items-center gap-4 border-b border-gray-200 bg-gray-50/50">
            <div style={{ width: 18 }} className="flex-shrink-0" />
            <div className="w-14 flex-shrink-0" />
            <div className="flex-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Part</div>
            <div className="w-24 flex-shrink-0 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vendor</div>
            <div className="w-20 flex-shrink-0 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cost</div>
            <div className="w-20 flex-shrink-0 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">List</div>
            <div className="w-24 flex-shrink-0 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Margin</div>
            <div className="w-20 flex-shrink-0 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Delivery</div>
            <div className="w-20 flex-shrink-0 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fitment</div>
            <div className="w-20 flex-shrink-0" />
          </div>

          {/* Result rows (with group dividers for multi-part) */}
          {sortedResults.length > 0 ? (
            <div className="bg-white">
              {renderResultRows()}
            </div>
          ) : (
            <div className="px-12 py-20 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                {enrichedResults.length === 0 ? 'No results found' : 'No results match your filters'}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {enrichedResults.length === 0
                  ? 'Try a different search term or check the vehicle info.'
                  : `Try relaxing your filters or clearing them to see all ${enrichedResults.length} results.`
                }
              </p>
              {enrichedResults.length > 0 && (
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); handleSmartFilterClear(); }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Bottom summary */}
          {sortedResults.length > 0 && (
            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs text-gray-400">
                <span>Showing {sortedResults.length} of {enrichedResults.length} results</span>
                <span>·</span>
                <span>Cost range: <span className="font-mono text-gray-600">${Math.min(...sortedResults.map(p => p.cost)).toFixed(2)} – ${Math.max(...sortedResults.map(p => p.cost)).toFixed(2)}</span></span>
                {isMultiPart && (
                  <>
                    <span>·</span>
                    <span>{partGroups.filter(g => g.count > 0).length} of {partGroups.length} parts found</span>
                  </>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">Best single margin: </span>
                <span className="text-sm font-bold text-green-600 font-mono">
                  +${Math.max(...sortedResults.map(p => p.margin)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
