/**
 * ResultsPage — Kayak-style parts results with margin columns.
 * 
 * Receives search context via URL params:
 *   ?q=brake+pads&year=2019&make=Honda&model=Accord&vin=...
 *   ?marcus=grinding+noise+from+front+brakes
 * 
 * Layout:
 *   - Left sidebar: Smart Filter + brand/vendor/material/tier/price/availability filters
 *   - Top bar: Sort tabs (Best Margin | Lowest Cost | Fastest | Marcus's Pick)
 *   - Result rows: Image | Part | Brand | Vendor | Cost | List Price | Margin | Delivery | Fitment | Action
 * 
 * TODO: Full implementation in next build phase.
 */

import { useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const { shop } = useShop();

  const query = searchParams.get('q') || searchParams.get('marcus') || '';
  const year = searchParams.get('year');
  const make = searchParams.get('make');
  const model = searchParams.get('model');

  const vehicleLabel = year && make && model ? `${year} ${make} ${model}` : null;

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Results Page</h2>
        <p className="text-sm text-gray-500 mb-4">
          Searching: <span className="font-semibold text-gray-800">{query}</span>
          {vehicleLabel && (
            <span className="text-gray-400"> for {vehicleLabel}</span>
          )}
        </p>
        <p className="text-xs text-gray-400">
          Full Kayak-style layout with filters, margin columns, and Smart Filter coming in the next build phase.
        </p>
      </div>
    </div>
  );
}
