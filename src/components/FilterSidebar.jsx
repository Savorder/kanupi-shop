/**
 * FilterSidebar — Left sidebar filter panel for B2B results.
 * 
 * Contains:
 *   - SmartFilter (AI-powered, at top)
 *   - Brand checkboxes (with counts, pinned brands at top)
 *   - Vendor checkboxes (with colored dots)
 *   - Material checkboxes
 *   - Quality Tier checkboxes
 *   - Shop Cost Range (min/max inputs)
 *   - Availability toggle
 *   - Condition checkboxes
 * 
 * All filter changes immediately update parent state — no "Apply" button.
 * Checkboxes update when SmartFilter is used.
 */

import { useState, useCallback } from 'react';
import { useShop } from '../context/ShopContext';
import SmartFilter from './SmartFilter';

const TIER_CONFIG = {
  best: { label: 'Premium', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  better: { label: 'Quality', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  good: { label: 'Economy', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const VENDOR_COLORS = {
  'WorldPac': '#1e40af',
  'NAPA': '#1d4ed8',
  'AutoZone Pro': '#ea580c',
  "O'Reilly Pro": '#16a34a',
  'eBay': '#7c3aed',
  'Amazon': '#d97706',
};

export default function FilterSidebar({
  filters,
  onFilterChange,
  availableBrands,
  availableVendors,
  availableMaterials,
  brandCounts,
  vendorCounts,
  onSmartFilterApply,
  onSmartFilterClear,
  smartFilterActive,
  smartFilterText,
}) {
  const { pinnedBrands } = useShop();

  const toggleArrayFilter = useCallback((key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  }, [filters, onFilterChange]);

  const activeFilterCount =
    (filters.brands?.length || 0) +
    (filters.vendors?.length || 0) +
    (filters.materials?.length || 0) +
    (filters.tiers?.length || 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.priceMax < 999 ? 1 : 0) +
    (filters.priceMin > 0 ? 1 : 0);

  const clearAllFilters = () => {
    onFilterChange({
      brands: [],
      vendors: [],
      materials: [],
      tiers: [],
      priceMin: 0,
      priceMax: 999,
      inStockOnly: false,
    });
  };

  // Sort brands: pinned first, then alphabetical
  const sortedBrands = [...availableBrands].sort((a, b) => {
    const aPin = pinnedBrands.includes(a) ? 0 : 1;
    const bPin = pinnedBrands.includes(b) ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;
    return a.localeCompare(b);
  });

  return (
    <aside
      className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto scrollbar-thin"
      style={{ maxHeight: 'calc(100vh - 160px)', position: 'sticky', top: 0 }}
    >
      <div className="p-4 space-y-5">
        {/* Smart Filter */}
        <SmartFilter
          onApply={onSmartFilterApply}
          onClear={onSmartFilterClear}
          isActive={smartFilterActive}
          appliedText={smartFilterText}
          availableBrands={availableBrands}
          availableVendors={availableVendors}
        />

        {/* Clear all */}
        {activeFilterCount > 0 && !smartFilterActive && (
          <button
            onClick={clearAllFilters}
            className="w-full text-xs text-gray-500 hover:text-red-600 transition-colors py-1"
          >
            Clear all filters ({activeFilterCount})
          </button>
        )}

        {/* Availability */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Availability
          </div>
          <FilterCheckbox
            label="In Stock only"
            checked={filters.inStockOnly || false}
            onChange={() => onFilterChange({ ...filters, inStockOnly: !filters.inStockOnly })}
          />
        </div>

        {/* Brand */}
        <FilterSection title="Brand" count={availableBrands.length}>
          {sortedBrands.map((brand) => (
            <FilterCheckbox
              key={brand}
              label={brand}
              count={brandCounts[brand]}
              checked={(filters.brands || []).includes(brand)}
              onChange={() => toggleArrayFilter('brands', brand)}
              pinned={pinnedBrands.includes(brand)}
            />
          ))}
        </FilterSection>

        {/* Vendor */}
        <FilterSection title="Vendor" count={availableVendors.length}>
          {availableVendors.map((vendor) => (
            <FilterCheckbox
              key={vendor}
              label={vendor}
              count={vendorCounts[vendor]}
              checked={(filters.vendors || []).includes(vendor)}
              onChange={() => toggleArrayFilter('vendors', vendor)}
              dotColor={VENDOR_COLORS[vendor]}
            />
          ))}
        </FilterSection>

        {/* Material */}
        {availableMaterials.length > 1 && (
          <FilterSection title="Material">
            {availableMaterials.map((mat) => (
              <FilterCheckbox
                key={mat}
                label={mat}
                checked={(filters.materials || []).includes(mat)}
                onChange={() => toggleArrayFilter('materials', mat)}
              />
            ))}
          </FilterSection>
        )}

        {/* Quality Tier */}
        <FilterSection title="Quality Tier">
          {['best', 'better', 'good'].map((tier) => (
            <FilterCheckbox
              key={tier}
              label={TIER_CONFIG[tier].label}
              checked={(filters.tiers || []).includes(tier)}
              onChange={() => toggleArrayFilter('tiers', tier)}
              dotClassName={TIER_CONFIG[tier].dot}
            />
          ))}
        </FilterSection>

        {/* Price Range */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Shop Cost Range
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
              <input
                type="number"
                value={filters.priceMin || 0}
                onChange={(e) => onFilterChange({ ...filters, priceMin: Number(e.target.value) || 0 })}
                className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
                min={0}
              />
            </div>
            <span className="text-xs text-gray-400">—</span>
            <div className="flex-1 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
              <input
                type="number"
                value={filters.priceMax || 999}
                onChange={(e) => onFilterChange({ ...filters, priceMax: Number(e.target.value) || 999 })}
                className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
                min={0}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FilterSection({ title, count, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
          {count !== undefined && <span className="text-[10px] text-gray-300">{count}</span>}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-300 transition-transform ${open ? '' : '-rotate-90'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

function FilterCheckbox({ label, count, checked, onChange, dotColor, dotClassName, pinned }) {
  return (
    <label
      className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group"
      onClick={(e) => { e.preventDefault(); onChange(); }}
    >
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-gray-400'
        }`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {dotColor && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />}
      {dotClassName && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClassName}`} />}
      <span className="text-xs text-gray-700 flex-1 truncate">
        {label}
        {pinned && <span className="ml-1 text-[9px] text-amber-500">★</span>}
      </span>
      {count !== undefined && <span className="text-[10px] text-gray-300 flex-shrink-0">{count}</span>}
    </label>
  );
}
