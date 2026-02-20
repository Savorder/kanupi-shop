/**
 * ResultRow — Single part result row in the Kayak-style results grid.
 * 
 * Displays:
 *   - Checkbox (multi-select for bulk ordering)
 *   - Product image (eBay image with tier-colored brand initial fallback)
 *   - Part name + part number
 *   - Brand with tier badge (Premium/Quality/Economy)
 *   - Vendor with color dot
 *   - Shop Cost (what shop pays)
 *   - List Price (what customer pays, from margin rules)
 *   - Margin ($ amount + %, always green)
 *   - Delivery ETA (color-coded: green ≤4h, amber ≤24h, gray >24h)
 *   - Fitment status (✓ Verified / ~ Likely / ? Unknown)
 *   - Add to Order button
 * 
 * Marcus's Pick gets an amber highlight banner when that sort is active.
 */

import { useShop } from '../context/ShopContext';

const TIER_CONFIG = {
  best: { label: 'Premium', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', initialBg: '#7c3aed' },
  better: { label: 'Quality', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', initialBg: '#2563eb' },
  good: { label: 'Economy', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', initialBg: '#059669' },
};

const VENDOR_COLORS = {
  'WorldPac': '#1e40af',
  'NAPA': '#1d4ed8',
  'AutoZone Pro': '#ea580c',
  "O'Reilly Pro": '#16a34a',
  'eBay': '#7c3aed',
  'Amazon': '#d97706',
};

const FITMENT_CONFIG = {
  verified: { icon: '✓', label: 'Verified Fit', className: 'text-green-600 bg-green-50 border-green-200' },
  likely: { icon: '~', label: 'Likely Fit', className: 'text-amber-600 bg-amber-50 border-amber-200' },
  unknown: { icon: '?', label: 'Unknown', className: 'text-gray-400 bg-gray-50 border-gray-200' },
};

function getDeliveryColor(hours) {
  if (hours <= 4) return 'text-green-600';
  if (hours <= 24) return 'text-amber-600';
  return 'text-gray-500';
}

function getDeliveryLabel(hours) {
  if (hours <= 1) return 'Same-day';
  if (hours <= 4) return `${hours}h pickup`;
  if (hours <= 24) return 'Next day';
  if (hours <= 48) return '2 days';
  if (hours <= 72) return '3 days';
  return `${Math.ceil(hours / 24)} days`;
}

export default function ResultRow({
  part,
  isSelected,
  onSelect,
  isMarcusPick,
  showMarcusBanner,
  onAddToOrder,
}) {
  const { shop } = useShop();
  const accentColor = shop?.accent_color || '#dc2626';
  const tier = TIER_CONFIG[part.tier] || TIER_CONFIG.good;
  const fitment = FITMENT_CONFIG[part.fitment] || FITMENT_CONFIG.unknown;
  const vendorColor = VENDOR_COLORS[part.vendor] || '#6b7280';

  return (
    <div className={`group transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}>
      {/* Marcus's Pick banner */}
      {showMarcusBanner && isMarcusPick && (
        <div className="px-5 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <span className="text-xs font-semibold text-amber-700">Marcus's Pick</span>
          <span className="text-[11px] text-amber-600">{part.marcusReason || 'Best balance of quality, fit, and margin'}</span>
        </div>
      )}

      <div className="px-5 py-3 flex items-center gap-4 border-b border-gray-100">
        {/* Checkbox */}
        <label
          className="flex items-center cursor-pointer"
          onClick={(e) => { e.preventDefault(); onSelect(part.id); }}
        >
          <div
            className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-gray-400'
            }`}
            style={{ width: 18, height: 18 }}
          >
            {isSelected && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>

        {/* Image */}
        <div className="w-14 h-14 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center bg-white">
          {part.imageUrl ? (
            <img
              src={part.imageUrl}
              alt={part.partName}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-full h-full items-center justify-center text-white text-sm font-bold ${part.imageUrl ? 'hidden' : 'flex'}`}
            style={{ background: tier.initialBg }}
          >
            {(part.brand || '?').charAt(0)}
          </div>
        </div>

        {/* Part info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900 truncate">{part.partName}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${tier.bg} ${tier.text} ${tier.border}`}>
              {tier.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-600">{part.brand}</span>
            {part.partNumber && (
              <>
                <span>·</span>
                <span className="font-mono text-[11px]">{part.partNumber}</span>
              </>
            )}
            {part.material && (
              <>
                <span>·</span>
                <span>{part.material}</span>
              </>
            )}
          </div>
        </div>

        {/* Vendor */}
        <div className="w-24 flex-shrink-0 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: vendorColor }} />
            <span className="text-xs font-medium text-gray-700">{part.vendor}</span>
          </div>
        </div>

        {/* Shop Cost */}
        <div className="w-20 flex-shrink-0 text-right">
          <div className="text-xs text-gray-400 mb-0.5">Cost</div>
          <div className="text-sm font-semibold text-gray-900 font-mono">${part.cost.toFixed(2)}</div>
        </div>

        {/* List Price */}
        <div className="w-20 flex-shrink-0 text-right">
          <div className="text-xs text-gray-400 mb-0.5">List</div>
          <div className="text-sm font-medium text-gray-600 font-mono">${part.listPrice.toFixed(2)}</div>
        </div>

        {/* Margin */}
        <div className="w-24 flex-shrink-0 text-right">
          <div className="text-xs text-gray-400 mb-0.5">Margin</div>
          <div className="text-sm font-bold text-green-600 font-mono">
            +${part.margin.toFixed(2)}
            <span className="text-[10px] font-medium text-green-500 ml-1">{part.marginPct.toFixed(0)}%</span>
          </div>
        </div>

        {/* Delivery */}
        <div className="w-20 flex-shrink-0 text-center">
          <div className="text-xs text-gray-400 mb-0.5">Delivery</div>
          <div className={`text-xs font-semibold ${getDeliveryColor(part.deliveryHours)}`}>
            {getDeliveryLabel(part.deliveryHours)}
          </div>
        </div>

        {/* Fitment */}
        <div className="w-20 flex-shrink-0 text-center">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${fitment.className}`}>
            <span>{fitment.icon}</span> {fitment.label}
          </span>
        </div>

        {/* Action */}
        <div className="w-20 flex-shrink-0 text-right">
          <button
            onClick={() => onAddToOrder(part)}
            className="px-3 py-1.5 text-[11px] font-semibold text-white rounded-lg transition-all hover:opacity-90"
            style={{ background: accentColor }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
