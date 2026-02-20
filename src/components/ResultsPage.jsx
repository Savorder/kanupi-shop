/**
 * ResultsPage — Kayak-style parts results with margin columns.
 * 
 * URL params:
 *   ?q=brake+pads&year=2019&make=Honda&model=Accord&vin=...
 *   ?marcus=grinding+noise+from+front+brakes
 * 
 * Layout:
 *   - Left: FilterSidebar (Smart Filter + brand/vendor/material/tier/price/stock)
 *   - Top: SortTabs (Best Margin | Lowest Cost | Fastest | Marcus's Pick)
 *   - Body: ResultRow grid with all margin/delivery/fitment columns
 * 
 * Filter + sort logic runs client-side on the full result set.
 * In production, initial data comes from /api/parts/search.
 */

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { enrichPartWithMargin } from '../utils/marginCalculator';
import FilterSidebar from './FilterSidebar';
import SortTabs from './SortTabs';
import ResultRow from './ResultRow';

// ── Mock data (replaced by API in production) ─────────────────────
const MOCK_RESULTS = [
  { id: 1, partName: 'ProACT Ultra-Premium Ceramic Pads', brand: 'Akebono', partNumber: 'ACT1184', material: 'Ceramic', tier: 'best', vendor: 'WorldPac', cost: 28.50, deliveryHours: 3, fitment: 'verified', imageUrl: null, marcusScore: 95, marcusReason: 'OE supplier, verified fit, highest margin' },
  { id: 2, partName: 'Premium Ceramic Brake Pads', brand: 'Brembo', partNumber: 'P83024N', material: 'Ceramic', tier: 'best', vendor: 'WorldPac', cost: 38.20, deliveryHours: 3, fitment: 'verified', imageUrl: null, marcusScore: 90 },
  { id: 3, partName: 'ThermoQuiet Ceramic Disc Pads', brand: 'Wagner', partNumber: 'QC1184', material: 'Ceramic', tier: 'better', vendor: 'NAPA', cost: 22.40, deliveryHours: 2, fitment: 'verified', imageUrl: null, marcusScore: 88 },
  { id: 4, partName: 'Gold Ceramic Brake Pads', brand: 'ACDelco', partNumber: '17D1184CH', material: 'Ceramic', tier: 'better', vendor: "O'Reilly Pro", cost: 24.90, deliveryHours: 4, fitment: 'verified', imageUrl: null, marcusScore: 85 },
  { id: 5, partName: 'QuietCast Ceramic Disc Pads', brand: 'Bosch', partNumber: 'BC1184', material: 'Ceramic', tier: 'better', vendor: 'AutoZone Pro', cost: 26.80, deliveryHours: 2, fitment: 'verified', imageUrl: null, marcusScore: 86 },
  { id: 6, partName: 'Ceramic Brake Pads', brand: 'StopTech', partNumber: '309.11840', material: 'Ceramic', tier: 'best', vendor: 'eBay', cost: 32.40, deliveryHours: 48, fitment: 'likely', imageUrl: null, marcusScore: 78 },
  { id: 7, partName: 'OE Replacement Ceramic Pads', brand: 'Centric', partNumber: '301.11840', material: 'Ceramic', tier: 'better', vendor: 'eBay', cost: 18.90, deliveryHours: 72, fitment: 'likely', imageUrl: null, marcusScore: 72 },
  { id: 8, partName: 'Posi Quiet Ceramic Brake Pads', brand: 'Centric', partNumber: '105.11840', material: 'Ceramic', tier: 'better', vendor: 'Amazon', cost: 19.50, deliveryHours: 24, fitment: 'likely', imageUrl: null, marcusScore: 74 },
  { id: 9, partName: 'Advanced Ceramic Disc Brake Pads', brand: 'Power Stop', partNumber: '16-1184', material: 'Ceramic', tier: 'better', vendor: 'Amazon', cost: 21.20, deliveryHours: 24, fitment: 'verified', imageUrl: null, marcusScore: 82 },
  { id: 10, partName: 'Semi-Metallic Brake Pads', brand: 'Duralast', partNumber: 'MKD1184', material: 'Semi-Metallic', tier: 'good', vendor: 'AutoZone Pro', cost: 14.80, deliveryHours: 1, fitment: 'verified', imageUrl: null, marcusScore: 60 },
  { id: 11, partName: 'Silver Semi-Metallic Pads', brand: 'ACDelco', partNumber: '14D1184CH', material: 'Semi-Metallic', tier: 'good', vendor: "O'Reilly Pro", cost: 16.20, deliveryHours: 4, fitment: 'verified', imageUrl: null, marcusScore: 62 },
  { id: 12, partName: 'Ceramic Brake Pads', brand: 'EBC', partNumber: 'DP31584C', material: 'Ceramic', tier: 'best', vendor: 'eBay', cost: 42.00, deliveryHours: 72, fitment: 'unknown', imageUrl: null, marcusScore: 70 },
];

// ── Default filter state ──────────────────────────────────────────
const DEFAULT_FILTERS = {
  brands: [],
  vendors: [],
  materials: [],
  tiers: [],
  priceMin: 0,
  priceMax: 999,
  inStockOnly: false,
};

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { shop, marginRules } = useShop();
  const accentColor = shop?.accent_color || '#dc2626';

  // Parse URL params
  const query = searchParams.get('q') || searchParams.get('marcus') || '';
  const isMarcusSearch = !!searchParams.get('marcus');
  const year = searchParams.get('year');
  const make = searchParams.get('make');
  const model = searchParams.get('model');
  const vehicleLabel = year && make && model ? `${year} ${make} ${model}` : null;

  // ── State ─────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState(isMarcusSearch ? 'marcus_pick' : 'best_margin');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [smartFilterActive, setSmartFilterActive] = useState(false);
  const [smartFilterText, setSmartFilterText] = useState('');

  // ── Enrich parts with margin calculations ─────────────────────
  const enrichedResults = useMemo(() => {
    return MOCK_RESULTS.map((part) => enrichPartWithMargin(part, marginRules, 'brake_pads'));
  }, [marginRules]);

  // ── Derive available filter options from data ─────────────────
  const availableBrands = useMemo(() => [...new Set(enrichedResults.map((p) => p.brand))].sort(), [enrichedResults]);
  const availableVendors = useMemo(() => [...new Set(enrichedResults.map((p) => p.vendor))].sort(), [enrichedResults]);
  const availableMaterials = useMemo(() => [...new Set(enrichedResults.map((p) => p.material).filter(Boolean))].sort(), [enrichedResults]);

  // Brand and vendor counts
  const brandCounts = useMemo(() => {
    const counts = {};
    enrichedResults.forEach((p) => { counts[p.brand] = (counts[p.brand] || 0) + 1; });
    return counts;
  }, [enrichedResults]);

  const vendorCounts = useMemo(() => {
    const counts = {};
    enrichedResults.forEach((p) => { counts[p.vendor] = (counts[p.vendor] || 0) + 1; });
    return counts;
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
  const sortedResults = useMemo(() => {
    const sorted = [...filteredResults];
    switch (sortBy) {
      case 'best_margin':
        return sorted.sort((a, b) => b.margin - a.margin);
      case 'lowest_cost':
        return sorted.sort((a, b) => a.cost - b.cost);
      case 'fastest_delivery':
        return sorted.sort((a, b) => a.deliveryHours - b.deliveryHours);
      case 'marcus_pick':
        return sorted.sort((a, b) => (b.marcusScore || 0) - (a.marcusScore || 0));
      default:
        return sorted;
    }
  }, [filteredResults, sortBy]);

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

  const handleAddToOrder = useCallback((part) => {
    alert(`Added to order: ${part.brand} ${part.partName} — Cost: $${part.cost.toFixed(2)}, List: $${part.listPrice.toFixed(2)}, Margin: +$${part.margin.toFixed(2)}`);
  }, []);

  const handleBulkAddToOrder = useCallback(() => {
    const selected = sortedResults.filter((p) => selectedIds.has(p.id));
    const totalMargin = selected.reduce((sum, p) => sum + p.margin, 0);
    alert(`Adding ${selected.length} parts to order — Total margin: +$${totalMargin.toFixed(2)}`);
    setSelectedIds(new Set());
  }, [sortedResults, selectedIds]);

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

  return (
    <div className="max-w-screen-2xl mx-auto">
      {/* Search context bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900">{query}</h1>
              {isMarcusSearch && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium">🤖 Marcus</span>
              )}
            </div>
            {vehicleLabel && (
              <p className="text-xs text-gray-400">
                for <span className="font-medium text-gray-600">{vehicleLabel}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Margin summary */}
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

      {/* Main layout */}
      <div className="flex">
        {/* Left sidebar */}
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

        {/* Results area */}
        <div className="flex-1 min-w-0">
          {/* Sort tabs */}
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

          {/* Result rows */}
          {sortedResults.length > 0 ? (
            <div className="bg-white">
              {sortedResults.map((part) => (
                <ResultRow
                  key={part.id}
                  part={part}
                  isSelected={selectedIds.has(part.id)}
                  onSelect={toggleSelect}
                  isMarcusPick={part.id === marcusPickId}
                  showMarcusBanner={sortBy === 'marcus_pick'}
                  onAddToOrder={handleAddToOrder}
                />
              ))}
            </div>
          ) : (
            <div className="px-12 py-20 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">No results match your filters</h3>
              <p className="text-sm text-gray-400 mb-4">
                Try relaxing your filters or clearing them to see all {enrichedResults.length} results.
              </p>
              <button
                onClick={() => { setFilters(DEFAULT_FILTERS); handleSmartFilterClear(); }}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Bottom margin summary */}
          {sortedResults.length > 0 && (
            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs text-gray-400">
                <span>Showing {sortedResults.length} of {enrichedResults.length} results</span>
                <span>·</span>
                <span>Cost range: <span className="font-mono text-gray-600">${Math.min(...sortedResults.map(p => p.cost)).toFixed(2)} – ${Math.max(...sortedResults.map(p => p.cost)).toFixed(2)}</span></span>
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
