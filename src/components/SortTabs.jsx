/**
 * SortTabs — Sort control bar for results page.
 * 
 * Tabs:
 *   - Best Margin (default for B2B) — highest $ margin first
 *   - Lowest Cost — cheapest shop cost first
 *   - Fastest — shortest delivery time first
 *   - Marcus's Pick — AI-weighted score (tier + fitment + margin + rating + speed)
 * 
 * Also shows result count and "Add to Order" button when rows are selected.
 */

import { useShop } from '../context/ShopContext';

const SORT_OPTIONS = [
  { key: 'best_margin', label: 'Best Margin', icon: '📈' },
  { key: 'lowest_cost', label: 'Lowest Cost', icon: '💲' },
  { key: 'fastest_delivery', label: 'Fastest', icon: '⚡' },
  { key: 'marcus_pick', label: "Marcus's Pick", icon: '🤖' },
];

export default function SortTabs({ sortBy, onSortChange, resultCount, totalCount, selectedCount, onAddToOrder }) {
  const { shop } = useShop();
  const accentColor = shop?.accent_color || '#dc2626';

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5">
      <div className="flex items-center justify-between">
        <div className="flex">
          {SORT_OPTIONS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onSortChange(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                sortBy === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {resultCount} of {totalCount} results
          </span>
          {selectedCount > 0 && (
            <button
              onClick={onAddToOrder}
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors hover:opacity-90"
              style={{ background: accentColor }}
            >
              Add {selectedCount} to Order →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
