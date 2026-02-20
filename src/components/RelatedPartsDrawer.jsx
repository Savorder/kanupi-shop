/**
 * RelatedPartsDrawer — "You might also need..." modal
 * 
 * Appears after a service writer selects a part from category browse
 * or text search. Shows:
 *   1. Position selector (front/rear/both) for position-sensitive parts
 *   2. Related parts with checkboxes, reasons, and pre-checked defaults
 *   3. Position notes explaining vehicle layout differences
 *   4. "Search All" button that fires multi-part search
 * 
 * Props:
 *   isOpen        - boolean, controls visibility
 *   partLabel     - string, the selected part name (e.g. "Brake Pads")
 *   vehicle       - object, the active vehicle context
 *   accentColor   - string, shop accent color for buttons
 *   onSearch      - function(queries[]), called with array of search queries
 *   onClose       - function(), called to dismiss
 */

import { useState, useEffect } from 'react';
import { getRelatedParts, buildSearchQueries } from '../config/relatedParts';

export default function RelatedPartsDrawer({ isOpen, partLabel, vehicle, accentColor, onSearch, onClose }) {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [checkedRelated, setCheckedRelated] = useState({});
  const [partInfo, setPartInfo] = useState(null);

  useEffect(() => {
    if (!isOpen || !partLabel) return;

    const info = getRelatedParts(partLabel);
    setPartInfo(info);

    if (info?.positions) {
      const defaultPos = info.positions.find((p) => p.default);
      setSelectedPosition(defaultPos ? defaultPos.value : null);
    } else {
      setSelectedPosition(null);
    }

    if (info?.related) {
      const defaults = {};
      info.related.forEach((r) => {
        defaults[r.label] = r.checked || false;
      });
      setCheckedRelated(defaults);
    } else {
      setCheckedRelated({});
    }
  }, [isOpen, partLabel]);

  if (!isOpen || !partLabel) return null;

  const vehicleLabel = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : '';

  const hasPositions = partInfo?.positions?.length > 0;
  const hasRelated = partInfo?.related?.length > 0;
  const hasAnyIntel = hasPositions || hasRelated;

  const selectedRelatedParts = Object.entries(checkedRelated)
    .filter(([, checked]) => checked)
    .map(([label]) => label);

  const totalParts = 1 + selectedRelatedParts.length;

  const handleToggleRelated = (label) => {
    setCheckedRelated((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSearch = () => {
    if (!partLabel) return;
    const queries = buildSearchQueries(partLabel, selectedPosition, selectedRelatedParts);
    onSearch(queries);
  };

  const handleSearchJustThis = () => {
    const queries = buildSearchQueries(partLabel, selectedPosition, []);
    onSearch(queries);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200 animate-slideUp">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 pt-5 pb-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">{partLabel}</h2>
              {vehicleLabel && (
                <p className="text-xs text-gray-400 mt-0.5">for {vehicleLabel}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-5">
          {hasPositions && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                📍 Which position?
              </h3>
              <div className="space-y-1.5">
                {partInfo.positions.map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => setSelectedPosition(pos.value)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 transition-all text-left ${
                      selectedPosition === pos.value
                        ? 'border-gray-900 bg-gray-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedPosition === pos.value
                        ? 'border-gray-900'
                        : 'border-gray-300'
                    }`}>
                      {selectedPosition === pos.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      selectedPosition === pos.value
                        ? 'font-semibold text-gray-900'
                        : 'text-gray-600'
                    }`}>
                      {pos.label}
                    </span>
                  </button>
                ))}
              </div>

              {partInfo.note && (
                <div className="mt-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex gap-2">
                    <span className="text-sm flex-shrink-0">💡</span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">{partInfo.note}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasRelated && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                🔗 You might also need...
              </h3>
              <div className="space-y-1.5">
                {partInfo.related.map((rel) => (
                  <button
                    key={rel.label}
                    onClick={() => handleToggleRelated(rel.label)}
                    className={`w-full flex items-start gap-3 px-3.5 py-3 rounded-xl border-2 transition-all text-left ${
                      checkedRelated[rel.label]
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      checkedRelated[rel.label]
                        ? 'border-gray-900 bg-gray-900'
                        : 'border-gray-300'
                    }`}>
                      {checkedRelated[rel.label] && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block ${
                        checkedRelated[rel.label]
                          ? 'font-semibold text-gray-900'
                          : 'font-medium text-gray-700'
                      }`}>
                        {rel.label}
                      </span>
                      <span className="text-[11px] text-gray-400 block mt-0.5 leading-snug">
                        {rel.reason}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasAnyIntel && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No position or related parts data for this part type.</p>
              <p className="text-xs text-gray-400 mt-1">Searching directly...</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 space-y-2">
          {hasRelated && selectedRelatedParts.length > 0 ? (
            <>
              <button
                onClick={handleSearch}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-sm"
                style={{ background: accentColor }}
              >
                Search All {totalParts} Parts →
              </button>
              <button
                onClick={handleSearchJustThis}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Just search {partLabel}
              </button>
            </>
          ) : (
            <button
              onClick={handleSearch}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-sm"
              style={{ background: accentColor }}
            >
              Search {partLabel} →
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.2s ease-out; }
      `}</style>
    </div>
  );
}
