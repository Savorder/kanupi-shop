/**
 * DashboardHome — Three-panel entry point for the B2B shop dashboard.
 * 
 * Panels:
 *   1. Vehicle Lookup (VIN + License Plate toggle)
 *   2. Part Search (text search + RockAuto-style category browser)
 *   3. Ask Marcus (AI diagnosis from customer symptoms)
 * 
 * Below panels: Recent Searches + Recent Orders with margin tracking.
 * Top: Time-aware greeting + daily stats (searches, orders, revenue, margin).
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import PART_CATEGORIES from '../config/partCategories';
import API from '../config/api';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

export default function DashboardHome() {
  const { shop, setVehicleContext } = useShop();
  const navigate = useNavigate();
  const accentColor = shop?.accent_color || '#dc2626';

  // ── Panel state ─────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState(null);

  // ── Vehicle Lookup state ────────────────────────────────────────
  const [vehicleLookupMode, setVehicleLookupMode] = useState('vin');
  const [vinInput, setVinInput] = useState('');
  const [plateInput, setPlateInput] = useState('');
  const [plateState, setPlateState] = useState(shop?.state || 'OR');
  const [vehicleDecoded, setVehicleDecoded] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState('');
  const [vehiclePartQuery, setVehiclePartQuery] = useState('');

  // ── Part Search state ───────────────────────────────────────────
  const [partSearchVehicle, setPartSearchVehicle] = useState('');
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [partSearchMode, setPartSearchMode] = useState('browse');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState(null);

  // ── Marcus state ────────────────────────────────────────────────
  const [marcusInput, setMarcusInput] = useState('');

  // ── Time ────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // ── Vehicle decode ──────────────────────────────────────────────
  const handleVehicleDecode = useCallback(async () => {
    if (vehicleLookupMode === 'vin' && vinInput.length < 17) return;
    if (vehicleLookupMode === 'plate' && plateInput.length < 2) return;

    setVehicleLoading(true);
    setVehicleError('');

    try {
      let response;

      if (vehicleLookupMode === 'vin') {
        response = await fetch(API.vehicles.decodeVin(vinInput));
      } else {
        response = await fetch(API.vehicles.decodePlate(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plate: plateInput, state: plateState }),
        });
      }

      if (!response.ok) {
        throw new Error('Vehicle not found. Please check and try again.');
      }

      const data = await response.json();
      const vehicleData = data.vehicle || data;

      const decoded = {
        vin: vehicleData.vin || vinInput.toUpperCase(),
        plate: vehicleLookupMode === 'plate' ? plateInput.toUpperCase() : null,
        state: vehicleLookupMode === 'plate' ? plateState : null,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        trim: vehicleData.trim || '',
        engine: vehicleData.engine || '',
      };

      setVehicleDecoded(decoded);
      setVehicleContext(decoded);
    } catch (err) {
      setVehicleError(err.message || 'Failed to decode vehicle');
    } finally {
      setVehicleLoading(false);
    }
  }, [vehicleLookupMode, vinInput, plateInput, plateState, setVehicleContext]);

  // ── Navigate to results ─────────────────────────────────────────
  const goToResults = useCallback((query, vehicle) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (vehicle) {
      if (vehicle.year) params.set('year', vehicle.year);
      if (vehicle.make) params.set('make', vehicle.make);
      if (vehicle.model) params.set('model', vehicle.model);
      if (vehicle.vin) params.set('vin', vehicle.vin);
    }
    navigate(`/results?${params.toString()}`);
  }, [navigate]);

  const handleVehiclePartSearch = () => {
    if (!vehiclePartQuery.trim() || !vehicleDecoded) return;
    goToResults(vehiclePartQuery, vehicleDecoded);
  };

  const handlePartSelect = (partKey, partLabel) => {
    goToResults(partLabel, null);
  };

  const handlePartSearchSubmit = () => {
    if (!partSearchQuery.trim()) return;
    goToResults(partSearchQuery, null);
  };

  const handleMarcusSubmit = () => {
    if (!marcusInput.trim()) return;
    // Marcus flows through the AI diagnostic — navigate to results with diagnostic context
    const params = new URLSearchParams();
    params.set('marcus', marcusInput);
    navigate(`/results?${params.toString()}`);
  };

  const vinOrPlateValid = vehicleLookupMode === 'vin' ? vinInput.length >= 17 : plateInput.length >= 2;

  // ── Quick stats (placeholder — will come from API) ──────────────
  const stats = { searches: 24, orders: 7, revenue: 847.50, avgMargin: 38.2 };

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {/* ── Greeting + Stats ─────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting()}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-6">
          {[
            { label: 'Searches', value: stats.searches, icon: '🔍' },
            { label: 'Orders', value: stats.orders, icon: '📦' },
            { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: '💰' },
            { label: 'Avg Margin', value: `${stats.avgMargin}%`, icon: '📈' },
          ].map((s) => (
            <div key={s.label} className="text-right">
              <div className="text-xs text-gray-400 mb-0.5">{s.icon} {s.label}</div>
              <div className="text-lg font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Three Panels ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">

        {/* ── Panel 1: Vehicle Lookup ──────────────────────────── */}
        <div
          className={`rounded-2xl border-2 transition-all ${
            activePanel === 'vehicle'
              ? 'border-gray-900 bg-white shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md cursor-pointer'
          }`}
          onClick={() => { if (activePanel !== 'vehicle') setActivePanel('vehicle'); }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${accentColor}12` }}>🚗</div>
              <div>
                <h2 className="font-bold text-gray-900">Vehicle Lookup</h2>
                <p className="text-xs text-gray-400">VIN or license plate</p>
              </div>
            </div>

            {activePanel === 'vehicle' ? (
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                {/* VIN / Plate toggle */}
                <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                  <button
                    onClick={() => { setVehicleLookupMode('vin'); setVehicleDecoded(null); setVehicleError(''); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      vehicleLookupMode === 'vin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    🔑 VIN
                  </button>
                  <button
                    onClick={() => { setVehicleLookupMode('plate'); setVehicleDecoded(null); setVehicleError(''); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      vehicleLookupMode === 'plate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    🪪 License Plate
                  </button>
                </div>

                {/* VIN input */}
                {vehicleLookupMode === 'vin' && (
                  <div className="relative">
                    <input
                      type="text"
                      value={vinInput}
                      onChange={(e) => { setVinInput(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17)); setVehicleDecoded(null); setVehicleError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleVehicleDecode(); }}
                      placeholder="Enter 17-character VIN"
                      maxLength={17}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all pr-14 font-mono-input"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-medium font-mono">
                      {vinInput.length}/17
                    </div>
                  </div>
                )}

                {/* Plate input */}
                {vehicleLookupMode === 'plate' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={plateInput}
                      onChange={(e) => { setPlateInput(e.target.value.toUpperCase().slice(0, 8)); setVehicleDecoded(null); setVehicleError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleVehicleDecode(); }}
                      placeholder="Plate #"
                      maxLength={8}
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all font-mono-input"
                      autoFocus
                    />
                    <select
                      value={plateState}
                      onChange={(e) => setPlateState(e.target.value)}
                      className="w-20 px-2 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-white text-gray-700 font-medium"
                    >
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {/* Error message */}
                {vehicleError && (
                  <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{vehicleError}</p>
                  </div>
                )}

                {/* Decode button */}
                {!vehicleDecoded && (
                  <button
                    onClick={handleVehicleDecode}
                    disabled={!vinOrPlateValid || vehicleLoading}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30"
                    style={{ background: accentColor }}
                  >
                    {vehicleLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Decoding...
                      </span>
                    ) : vehicleLookupMode === 'vin' ? 'Decode VIN' : 'Look Up Plate'}
                  </button>
                )}

                {/* Decoded vehicle card */}
                {vehicleDecoded && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">
                        {vehicleDecoded.year} {vehicleDecoded.make} {vehicleDecoded.model} {vehicleDecoded.trim}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">✓ Decoded</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{vehicleDecoded.engine}</span>
                      {vehicleDecoded.plate && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{vehicleDecoded.state} {vehicleDecoded.plate}</span>
                        </>
                      )}
                    </div>
                    <input
                      type="text"
                      value={vehiclePartQuery}
                      onChange={(e) => setVehiclePartQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleVehiclePartSearch(); }}
                      placeholder="What part do you need?"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-all"
                    />
                    <button
                      onClick={handleVehiclePartSearch}
                      disabled={!vehiclePartQuery.trim()}
                      className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-30"
                      style={{ background: accentColor }}
                    >
                      Search Parts →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-400">Decode a VIN or license plate for exact-fit parts</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Panel 2: Part Search ─────────────────────────────── */}
        <div
          className={`rounded-2xl border-2 transition-all ${
            activePanel === 'part'
              ? 'border-gray-900 bg-white shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md cursor-pointer'
          }`}
          onClick={() => { if (activePanel !== 'part') setActivePanel('part'); }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${accentColor}12` }}>🔧</div>
              <div>
                <h2 className="font-bold text-gray-900">Part Search</h2>
                <p className="text-xs text-gray-400">Search or browse by category</p>
              </div>
            </div>

            {activePanel === 'part' ? (
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={partSearchVehicle}
                  onChange={(e) => setPartSearchVehicle(e.target.value)}
                  placeholder="Vehicle (optional — e.g. 2019 Honda Accord)"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-all"
                />

                {/* Browse / Search toggle */}
                <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                  <button
                    onClick={() => setPartSearchMode('browse')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      partSearchMode === 'browse' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    📂 Browse Categories
                  </button>
                  <button
                    onClick={() => setPartSearchMode('search')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      partSearchMode === 'search' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    🔍 Search by Name
                  </button>
                </div>

                {/* Text search */}
                {partSearchMode === 'search' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={partSearchQuery}
                      onChange={(e) => setPartSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePartSearchSubmit(); }}
                      placeholder="Part name or number (e.g. brake pads, 15400-PLM-A02)"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                      autoFocus
                    />
                    <button
                      onClick={handlePartSearchSubmit}
                      disabled={!partSearchQuery.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30"
                      style={{ background: accentColor }}
                    >
                      Search Parts →
                    </button>
                  </div>
                )}

                {/* Category browser */}
                {partSearchMode === 'browse' && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden max-h-72 overflow-y-auto scrollbar-thin">
                    {PART_CATEGORIES.map((cat) => (
                      <div key={cat.key}>
                        <button
                          onClick={() => { setExpandedCategory(expandedCategory === cat.key ? null : cat.key); setExpandedSubcategory(null); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                            expandedCategory === cat.key ? 'bg-gray-50' : ''
                          }`}
                        >
                          <span className="text-sm">{cat.icon}</span>
                          <span className="text-xs font-semibold text-gray-800 flex-1">{cat.label}</span>
                          <span className="text-[10px] text-gray-300">
                            {cat.subcategories.reduce((a, s) => a + s.parts.length, 0)}
                          </span>
                          <svg className={`w-3.5 h-3.5 text-gray-300 transition-transform ${expandedCategory === cat.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {expandedCategory === cat.key && (
                          <div className="bg-gray-50/50">
                            {cat.subcategories.map((sub) => (
                              <div key={sub.key}>
                                <button
                                  onClick={() => setExpandedSubcategory(expandedSubcategory === sub.key ? null : sub.key)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 pl-8 text-left hover:bg-gray-100/80 transition-colors border-b border-gray-100/60 ${
                                    expandedSubcategory === sub.key ? 'bg-gray-100/60' : ''
                                  }`}
                                >
                                  <span className="text-[11px] font-medium text-gray-600 flex-1">{sub.label}</span>
                                  <span className="text-[10px] text-gray-300">{sub.parts.length}</span>
                                  <svg className={`w-3 h-3 text-gray-300 transition-transform ${expandedSubcategory === sub.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {expandedSubcategory === sub.key && sub.parts.map((part) => (
                                  <button
                                    key={part.key}
                                    onClick={() => handlePartSelect(part.key, part.label)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 pl-12 text-left hover:bg-blue-50 transition-colors border-b border-gray-100/40 group"
                                  >
                                    <span className="text-[11px] text-gray-500 group-hover:text-blue-700 flex-1 transition-colors">{part.label}</span>
                                    <svg className="w-3.5 h-3.5 text-gray-200 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-400">Search by name, number, or browse categories</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Panel 3: Ask Marcus ──────────────────────────────── */}
        <div
          className={`rounded-2xl border-2 transition-all ${
            activePanel === 'marcus'
              ? 'border-gray-900 bg-white shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md cursor-pointer'
          }`}
          onClick={() => { if (activePanel !== 'marcus') setActivePanel('marcus'); }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${accentColor}12` }}>🤖</div>
              <div>
                <h2 className="font-bold text-gray-900">Ask Marcus</h2>
                <p className="text-xs text-gray-400">AI-powered diagnosis</p>
              </div>
            </div>

            {activePanel === 'marcus' ? (
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={marcusInput}
                  onChange={(e) => setMarcusInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleMarcusSubmit(); } }}
                  placeholder={"Describe the customer's issue...\n\ne.g. 2018 F-150, grinding noise from front when braking at low speed. Started last week."}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-none"
                  rows={4}
                  autoFocus
                />
                <button
                  onClick={handleMarcusSubmit}
                  disabled={!marcusInput.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30"
                  style={{ background: accentColor }}
                >
                  Ask Marcus →
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {['Brake noise', 'Check engine light', 'A/C not cold', 'Overheating', "Won't start", 'P0420 code'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setMarcusInput(q)}
                      className="px-2.5 py-1 text-[11px] text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-400">Describe symptoms, get parts recommendations</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Keyboard Shortcut Hints ──────────────────────────────── */}
      <div className="flex items-center justify-center gap-6">
        {[
          { keys: 'V', label: 'Vehicle Lookup' },
          { keys: 'P', label: 'Part Search' },
          { keys: 'M', label: 'Ask Marcus' },
        ].map((shortcut) => (
          <div key={shortcut.keys} className="flex items-center gap-1.5 text-[11px] text-gray-300">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-400">{shortcut.keys}</kbd>
            <span>{shortcut.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
