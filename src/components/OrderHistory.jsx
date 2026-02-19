/**
 * OrderHistory — Searchable order table with margin tracking.
 * 
 * Displays all parts ordered through the shop dashboard with:
 *   - Vehicle, RO number, part, brand, vendor
 *   - Cost, list price, margin ($ and %)
 *   - Status tracking (selected → ordered → shipped → delivered → installed)
 *   - Filterable by date range, vehicle, writer
 *   - Exportable to CSV
 * 
 * TODO: Full implementation in next build phase.
 */

import { useShop } from '../context/ShopContext';

export default function OrderHistory() {
  const { shop } = useShop();

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">📦</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Order History</h2>
        <p className="text-sm text-gray-500 mb-4">
          Searchable order table with margin tracking, RO numbers, and status.
        </p>
        <p className="text-xs text-gray-400">
          Full implementation coming in the next build phase.
        </p>
      </div>
    </div>
  );
}
