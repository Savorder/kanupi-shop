/**
 * SmartFilter — AI-powered natural language filter for B2B results.
 * 
 * Service writers type plain English like:
 *   "ceramic under $30 not Duralast in stock"
 * 
 * The component parses this into structured filter criteria and
 * silently applies them — no chat response, just action.
 * 
 * Parsing logic:
 *   - Material detection: "ceramic", "semi-metallic", "organic"
 *   - Price cap: "under $40", "below 30", "max $25"
 *   - Brand inclusion: brand names found in available brands
 *   - Brand exclusion: "not Duralast", "no Wagner", "exclude Monroe"
 *   - Stock filter: "in stock", "available now", "available today"
 *   - Tier filter: "premium", "economy", "quality"
 *   - Vendor filter: vendor names found in available vendors
 */

import { useState } from 'react';
import { useShop } from '../context/ShopContext';

/**
 * Parse natural language filter text into structured filter criteria.
 * 
 * @param {string} text - User's natural language input
 * @param {string[]} availableBrands - Brands present in current results
 * @param {string[]} availableVendors - Vendors present in current results
 * @returns {Object} Structured filter criteria
 */
export function parseSmartFilter(text, availableBrands = [], availableVendors = []) {
  const lower = text.toLowerCase().trim();
  const filters = {
    materials: [],
    brands: [],
    excludedBrands: [],
    vendors: [],
    tiers: [],
    priceMax: null,
    priceMin: null,
    inStockOnly: false,
  };

  // Material detection
  if (lower.includes('ceramic')) filters.materials.push('Ceramic');
  if (lower.includes('semi-metallic') || lower.includes('semi metallic') || lower.includes('semimetallic')) filters.materials.push('Semi-Metallic');
  if (lower.includes('organic')) filters.materials.push('Organic');

  // Price detection
  const underMatch = lower.match(/(?:under|below|max|less than|cheaper than)\s*\$?(\d+(?:\.\d{1,2})?)/);
  if (underMatch) filters.priceMax = parseFloat(underMatch[1]);

  const overMatch = lower.match(/(?:over|above|min|more than|at least)\s*\$?(\d+(?:\.\d{1,2})?)/);
  if (overMatch) filters.priceMin = parseFloat(overMatch[1]);

  // Stock detection
  if (lower.includes('in stock') || lower.includes('available now') || lower.includes('available today') || lower.includes('same day')) {
    filters.inStockOnly = true;
  }

  // Tier detection
  if (lower.includes('premium') || lower.includes('best')) filters.tiers.push('best');
  if (lower.includes('quality') || lower.includes('mid-range') || lower.includes('better')) filters.tiers.push('better');
  if (lower.includes('economy') || lower.includes('budget') || lower.includes('cheap')) filters.tiers.push('good');

  // Brand exclusion detection (must come before inclusion)
  const excludedBrands = [];
  availableBrands.forEach((brand) => {
    const brandLower = brand.toLowerCase();
    if (
      lower.includes(`not ${brandLower}`) ||
      lower.includes(`no ${brandLower}`) ||
      lower.includes(`exclude ${brandLower}`) ||
      lower.includes(`without ${brandLower}`) ||
      lower.includes(`skip ${brandLower}`)
    ) {
      excludedBrands.push(brand);
    }
  });
  filters.excludedBrands = excludedBrands;

  // Brand inclusion detection
  availableBrands.forEach((brand) => {
    const brandLower = brand.toLowerCase();
    if (lower.includes(brandLower) && !excludedBrands.includes(brand)) {
      filters.brands.push(brand);
    }
  });

  // If brands are excluded but none explicitly included, include all non-excluded
  if (excludedBrands.length > 0 && filters.brands.length === 0) {
    filters.brands = availableBrands.filter((b) => !excludedBrands.includes(b));
  }

  // Vendor detection
  availableVendors.forEach((vendor) => {
    if (lower.includes(vendor.toLowerCase())) {
      filters.vendors.push(vendor);
    }
  });

  return filters;
}

export default function SmartFilter({ onApply, onClear, isActive, appliedText, availableBrands, availableVendors }) {
  const { shop } = useShop();
  const accentColor = shop?.accent_color || '#dc2626';
  const [inputText, setInputText] = useState('');

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    const parsed = parseSmartFilter(inputText, availableBrands, availableVendors);
    onApply(parsed, inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 p-3 bg-gradient-to-b from-gray-50/80 to-white">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">✨</span>
        <span className="text-xs font-semibold text-gray-700">Smart Filter</span>
        <span className="text-[10px] text-gray-400 ml-auto">AI-powered</span>
      </div>

      {isActive ? (
        <div className="space-y-2">
          <div className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-2 leading-relaxed">
            &ldquo;{appliedText}&rdquo;
          </div>
          <button
            onClick={onClear}
            className="w-full text-xs text-gray-500 hover:text-red-600 py-1 transition-colors"
          >
            ✕ Clear smart filter
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try: ceramic under $30, not Duralast, in stock"
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 placeholder-gray-400 transition-all bg-white"
            rows={2}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim()}
            className="w-full py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-30"
            style={{ background: accentColor }}
          >
            Filter results
          </button>
        </div>
      )}
    </div>
  );
}
