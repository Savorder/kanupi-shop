/**
 * DashboardHome — Vehicle-first entry point for the B2B shop dashboard.
 * 
 * Flow:
 *   1. VEHICLE FIRST — Decode via VIN, License Plate, or Year/Make/Model dropdowns
 *   2. Once vehicle is set, Part Search and Marcus panels unlock
 *   3. Part selection opens RelatedPartsDrawer for position + related parts
 *   4. Multi-part search navigates to grouped results
 * 
 * Panels:
 *   1. Vehicle Lookup (VIN + License Plate + Year/Make/Model toggle)
 *   2. Part Search (text search + category browser) — requires vehicle
 *   3. Ask Marcus (AI diagnosis) — requires vehicle
 * 
 * Top: Time-aware greeting + daily stats
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import PART_CATEGORIES from '../config/partCategories';
import { getRelatedParts } from '../config/relatedParts';
import RelatedPartsDrawer from './RelatedPartsDrawer';
import API from '../config/api';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

export default function DashboardHome() {
  const { shop, vehicle, setVehicleContext, clearVehicle } = useShop();
  const navigate = useNavigate();
  const accentColor = shop?.accent_color || '#dc2626';

  // ── Panel state ─────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState(vehicle ? null : 'vehicle');

  // ── Vehicle Lookup state ────────────────────────────────────────
  const [vehicleLookupMode, setVehicleLookupMode] = useState('vin');
  const [vinInput, setVinInput] = useState('');
  const [plateInput, setPlateInput] = useState('');
  const [plateState, setPlateState] = useState(shop?.state || 'OR');
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState('');

  // ── Year/Make/Model dropdown state ──────────────────────────────
  const [years, setYears] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [trims, setTrims] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedTrim, setSelectedTrim] = useState('');
  const [ymmLoading, setYmmLoading] = useState(false);

  // ── Part Search state ───────────────────────────────────────────
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [partSearchMode, setPartSearchMode] = useState('browse');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState(null);

  // ── Related Parts Drawer state ──────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPartLabel, setDrawerPartLabel] = useState('');

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

  // ── Load years on mount ─────────────────────────────────────────
  useEffect(() => {
    if (vehicleLookupMode === 'ymm' && years.length === 0) {
      loadYears();
    }
  }, [vehicleLookupMode]);

  const loadYears = async () => {
    try {
      const res = await fetch(API.vehicles.years());
      const data = await res.json();
      const yearList = data.data || data.years || data || [];
      const sorted = Array.isArray(yearList) ? yearList.sort((a, b) => b - a) : [];
      setYears(sorted);
    } catch (err) {
      console.error('[DashboardHome] Failed to load years:', err);
    }
  };

  const loadMakes = async (year) => {
    setMakes([]); setModels([]); setTrims([]);
    setSelectedMake(''); setSelectedModel(''); setSelectedTrim('');
    if (!year) return;
    try {
      setYmmLoading(true);
      const res = await fetch(API.vehicles.makes(year));
      const data = await res.json();
      const makeList = data.data || data.makes || data || [];
      setMakes(Array.isArray(makeList) ? makeList.sort() : []);
    } catch (err) {
      console.error('[DashboardHome] Failed to load makes:', err);
    } finally { setYmmLoading(false); }
  };

  const loadModels = async (year, make) => {
    setModels([]); setTrims([]);
    setSelectedModel(''); setSelectedTrim('');
    if (!year || !make) return;
    try {
      setYmmLoading(true);
      const res = await fetch(API.vehicles.models(year, make));
      const data = await res.json();
      const modelList = data.data || data.models || data || [];
      setModels(Array.isArray(modelList) ? modelList.sort() : []);
    } catch (err) {
      console.error('[DashboardHome] Failed to load models:', err);
    } finally { setYmmLoading(false); }
  };

  const loadTrims = async (year, make, model) => {
    setTrims([]); setSelectedTrim('');
    if (!year || !make || !model) return;
    try {
      setYmmLoading(true);
      const res = await fetch(API.vehicles.trims(year, make, model));
      const data = await res.json();
      const trimList = data.data || data.trims || data || [];
      const raw = Array.isArray(trimList) ? trimList : [];
      const names = raw.map((t) => (typeof t === 'object' ? t.name || t.trim || t : t));
      const unique = [...new Set(names)].filter(Boolean).sort();
      setTrims(unique);
    } catch (err) {
      console.error('[DashboardHome] Failed to load trims:', err);
    } finally { setYmmLoading(false); }
  };

  const handleYearChange = (year) => { setSelectedYear(year); loadMakes(year); };
  const handleMakeChange = (make) => { setSelectedMake(make); loadModels(selectedYear, make); };
  const handleModelChange = (model) => { setSelectedModel(model); loadTrims(selectedYear, selectedMake, model); };
  const handleTrimChange = (trim) => { setSelectedTrim(trim); };

  const handleYmmSelect = () => {
    if (!selectedYear || !selectedMake || !selectedModel) return;
    setVehicleContext({
      year: selectedYear,
      make: selectedMake,
      model: selectedModel,
      trim: selectedTrim || '',
      engine: '',
    });
  };

  // ── VIN / Plate decode ──────────────────────────────────────────
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

      if (!response.ok) throw new Error('Vehicle not found. Please check and try again.');

      const data = await response.json();
      const vehicleData = data.vehicle || data;

      setVehicleContext({
        vin: vehicleData.vin || vinInput.toUpperCase(),
        plate: vehicleLookupMode === 'plate' ? plateInput.toUpperCase() : null,
        state: vehicleLookupMode === 'plate' ? plateState : null,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        trim: vehicleData.trim || '',
        engine: vehicleData.engine || '',
      });
    } catch (err) {
      setVehicleError(err.message || 'Failed to decode vehicle');
    } finally {
      setVehicleLoading(false);
    }
  }, [vehicleLookupMode, vinInput, plateInput, plateState, setVehicleContext]);

  // ── Change vehicle ──────────────────────────────────────────────
  const handleChangeVehicle = () => {
    clearVehicle();
    setVinInput(''); setPlateInput('');
    setSelectedYear(''); setSelectedMake(''); setSelectedModel(''); setSelectedTrim('');
    setMakes([]); setModels([]); setTrims([]);
    setVehicleError('');
    setActivePanel('vehicle');
  };

  // ── Navigate to results (single or multi-part) ─────────────────
  const goToResults = useCallback((query, isMarcus = false) => {
    const params = new URLSearchParams();
    if (isMarcus) {
      params.set('marcus', query);
    } else {
      params.set('q', query);
    }
    if (vehicle) {
      if (vehicle.year) params.set('year', vehicle.year);
      if (vehicle.make) params.set('make', vehicle.make);
      if (vehicle.model) params.set('model', vehicle.model);
      if (vehicle.vin) params.set('vin', vehicle.vin);
    }
    navigate(`/results?${params.toString()}`);
  }, [navigate, vehicle]);

  const goToMultiPartResults = useCallback((queries) => {
    const params = new URLSearchParams();
    params.set('q', queries[0].query);
    if (queries.length > 1) {
      params.set('parts', JSON.stringify(queries.map((q) => q.query)));
      params.set('labels', JSON.stringify(queries.map((q) => q.label)));
    }
    if (vehicle) {
      if (vehicle.year) params.set('year', vehicle.year);
      if (vehicle.make) params.set('make', vehicle.make);
      if (vehicle.model) params.set('model', vehicle.model);
      if (vehicle.vin) params.set('vin', vehicle.vin);
    }
    navigate(`/results?${params.toString()}`);
  }, [navigate, vehicle]);

  // ── Part selection → opens drawer or goes direct ────────────────
  const handlePartSelect = (partKey, partLabel) => {
    const intel = getRelatedParts(partLabel);
    if (intel) {
      setDrawerPartLabel(partLabel);
      setDrawerOpen(true);
    } else {
      goToResults(partLabel);
    }
  };

  const handlePartSearchSubmit = () => {
    if (!partSearchQuery.trim()) return;
    const intel = getRelatedParts(partSearchQuery.trim());
    if (intel) {
      setDrawerPartLabel(partSearchQuery.trim());
      setDrawerOpen(true);
    } else {
      goToResults(partSearchQuery.trim());
    }
  };

  const handleDrawerSearch = (queries) => {
    setDrawerOpen(false);
    if (queries.length === 1) {
      goToResults(queries[0].query);
    } else {
      goToMultiPartResults(queries);
    }
  };

  const handleMarcusSubmit = () => {
    if (!marcusInput.trim()) return;
    goToResults(marcusInput, true);
  };

  // ── Derived state ───────────────────────────────────────────────
  const hasVehicle = !!vehicle;
  const vinOrPlateValid = vehicleLookupMode === 'vin' ? vinInput.length >= 17 : plateInput.length >= 2;
  const ymmValid = selectedYear && selectedMake && selectedModel;
  const stats = { searches: 24, orders: 7, revenue: 847.50, avgMargin: 38.2 };

  const LockedOverlay = () => (
    <div className="mt-4 px-4 py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
      <div className="text-2xl mb-2">🔒</div>
      <p className="text-xs font-semibold text-gray-500 mb-1">Vehicle required</p>
      <p className="text-[11px] text-gray-400 mb-3">Decode a vehicle first to search parts</p>
      <button
        onClick={() => setActivePanel('vehicle')}
        className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors"
        style={{ background: accentColor }}
      >
        Set Vehicle →
      </button>
    </div>
  );

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {/* ── Greeting + Stats ─────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6">
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

      {/* ── Active Vehicle Bar ────────────────────────────────────── */}
      {hasVehicle && (
        <div className="mb-6 bg-white rounded-2xl border-2 border-green-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-green-50">🚗</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">✓ Active</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                {vehicle.engine && <span>{vehicle.engine}</span>}
                {vehicle.vin && (
                  <>
                    {vehicle.engine && <span>·</span>}
                    <span className="font-mono">{vehicle.vin}</span>
                  </>
                )}
                {vehicle.plate && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{vehicle.state} {vehicle.plate}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleChangeVehicle}
            className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
          >
            Change Vehicle
          </button>
        </div>
      )}

      {/* ── Three Panels ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">

        {/* ── Panel 1: Vehicle Lookup ──────────────────────────────── */}
        {!hasVehicle && (
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
                  <p className="text-xs text-gray-400">VIN, plate, or year/make/model</p>
                </div>
              </div>

              {activePanel === 'vehicle' ? (
                <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                    <button
                      onClick={() => { setVehicleLookupMode('vin'); setVehicleError(''); }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        vehicleLookupMode === 'vin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      🔑 VIN
                    </button>
                    <button
                      onClick={() => { setVehicleLookupMode('plate'); setVehicleError(''); }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        vehicleLookupMode === 'plate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      🪪 Plate
                    </button>
                    <button
                      onClick={() => { setVehicleLookupMode('ymm'); setVehicleError(''); if (years.length === 0) loadYears(); }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        vehicleLookupMode === 'ymm' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      📋 Y/M/M
                    </button>
                  </div>

                  {vehicleLookupMode === 'vin' && (
                    <div className="relative">
                      <input
                        type="text"
                        value={vinInput}
                        onChange={(e) => { setVinInput(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17)); setVehicleError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleVehicleDecode(); }}
                        placeholder="Enter 17-character VIN"
                        maxLength={17}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all pr-14 font-mono"
                        autoFocus
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-medium font-mono">
                        {vinInput.length}/17
                      </div>
                    </div>
                  )}

                  {vehicleLookupMode === 'plate' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={plateInput}
                        onChange={(e) => { setPlateInput(e.target.value.toUpperCase().slice(0, 8)); setVehicleError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleVehicleDecode(); }}
                        placeholder="Plate #"
                        maxLength={8}
                        className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all font-mono"
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

                  {vehicleLookupMode === 'ymm' && (
                    <div className="space-y-2">
                      <select value={selectedYear} onChange={(e) => handleYearChange(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-white text-gray-700">
                        <option value="">Select Year</option>
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select value={selectedMake} onChange={(e) => handleMakeChange(e.target.value)} disabled={!selectedYear || makes.length === 0} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-white text-gray-700 disabled:opacity-40 disabled:bg-gray-50">
                        <option value="">{ymmLoading && !selectedMake ? 'Loading...' : 'Select Make'}</option>
                        {makes.map((m) => { const name = typeof m === 'object' ? m.name || m.make : m; return <option key={name} value={name}>{name}</option>; })}
                      </select>
                      <select value={selectedModel} onChange={(e) => handleModelChange(e.target.value)} disabled={!selectedMake || models.length === 0} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-white text-gray-700 disabled:opacity-40 disabled:bg-gray-50">
                        <option value="">{ymmLoading && !selectedModel ? 'Loading...' : 'Select Model'}</option>
                        {models.map((m) => { const name = typeof m === 'object' ? m.name || m.model : m; return <option key={name} value={name}>{name}</option>; })}
                      </select>
                      {trims.length > 0 && (
                        <select value={selectedTrim} onChange={(e) => handleTrimChange(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-white text-gray-700">
                          <option value="">Trim (optional)</option>
                          {trims.map((t) => { const name = typeof t === 'object' ? t.name || t.trim || t : t; return <option key={name} value={name}>{name}</option>; })}
                        </select>
                      )}
                    </div>
                  )}

                  {vehicleError && (
                    <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">{vehicleError}</p>
                    </div>
                  )}

                  {vehicleLookupMode === 'ymm' ? (
                    <button onClick={handleYmmSelect} disabled={!ymmValid || ymmLoading} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30" style={{ background: accentColor }}>
                      {ymmLoading ? (<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Loading...</span>) : 'Select Vehicle'}
                    </button>
                  ) : (
                    <button onClick={handleVehicleDecode} disabled={!vinOrPlateValid || vehicleLoading} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30" style={{ background: accentColor }}>
                      {vehicleLoading ? (<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Decoding...</span>) : vehicleLookupMode === 'vin' ? 'Decode VIN' : 'Look Up Plate'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-400">Decode a VIN, plate, or select year/make/model</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Panel 2: Part Search ─────────────────────────────────── */}
        <div
          className={`rounded-2xl border-2 transition-all ${
            activePanel === 'part'
              ? 'border-gray-900 bg-white shadow-lg'
              : hasVehicle
                ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md cursor-pointer'
                : 'border-gray-200 bg-gray-50/50 cursor-pointer'
          }`}
          onClick={() => { if (activePanel !== 'part') setActivePanel(hasVehicle ? 'part' : 'vehicle'); }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: hasVehicle ? `${accentColor}12` : '#f3f4f6' }}>🔧</div>
              <div>
                <h2 className={`font-bold ${hasVehicle ? 'text-gray-900' : 'text-gray-400'}`}>Part Search</h2>
                <p className="text-xs text-gray-400">
                  {hasVehicle ? `Search for ${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Set vehicle first'}
                </p>
              </div>
            </div>

            {!hasVehicle ? (
              activePanel === 'part' ? <LockedOverlay /> : (
                <div className="mt-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-400">🔒 Decode a vehicle first to search parts</span>
                </div>
              )
            ) : activePanel === 'part' ? (
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                  <button onClick={() => setPartSearchMode('browse')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${partSearchMode === 'browse' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    📂 Browse Categories
                  </button>
                  <button onClick={() => setPartSearchMode('search')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${partSearchMode === 'search' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    🔍 Search by Name
                  </button>
                </div>

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
                    <button onClick={handlePartSearchSubmit} disabled={!partSearchQuery.trim()} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30" style={{ background: accentColor }}>
                      Search Parts →
                    </button>
                  </div>
                )}

                {partSearchMode === 'browse' && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden max-h-72 overflow-y-auto scrollbar-thin">
                    {PART_CATEGORIES.map((cat) => (
                      <div key={cat.key}>
                        <button
                          onClick={() => { setExpandedCategory(expandedCategory === cat.key ? null : cat.key); setExpandedSubcategory(null); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${expandedCategory === cat.key ? 'bg-gray-50' : ''}`}
                        >
                          <span className="text-sm">{cat.icon}</span>
                          <span className="text-xs font-semibold text-gray-800 flex-1">{cat.label}</span>
                          <span className="text-[10px] text-gray-300">{cat.subcategories.reduce((a, s) => a + s.parts.length, 0)}</span>
                          <svg className={`w-3.5 h-3.5 text-gray-300 transition-transform ${expandedCategory === cat.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {expandedCategory === cat.key && (
                          <div className="bg-gray-50/50">
                            {cat.subcategories.map((sub) => (
                              <div key={sub.key}>
                                <button
                                  onClick={() => setExpandedSubcategory(expandedSubcategory === sub.key ? null : sub.key)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 pl-8 text-left hover:bg-gray-100/80 transition-colors border-b border-gray-100/60 ${expandedSubcategory === sub.key ? 'bg-gray-100/60' : ''}`}
                                >
                                  <span className="text-[11px] font-medium text-gray-600 flex-1">{sub.label}</span>
                                  <span className="text-[10px] text-gray-300">{sub.parts.length}</span>
                                  <svg className={`w-3 h-3 text-gray-300 transition-transform ${expandedSubcategory === sub.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {expandedSubcategory === sub.key && sub.parts.map((part) => (
                                  <button
                                    key={part.key}
                                    onClick={() => handlePartSelect(part.key, part.label)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 pl-12 text-left hover:bg-blue-50 transition-colors border-b border-gray-100/40 group"
                                  >
                                    <span className="text-[11px] text-gray-500 group-hover:text-blue-700 flex-1 transition-colors">{part.label}</span>
                                    <svg className="w-3.5 h-3.5 text-gray-200 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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

        {/* ── Panel 3: Ask Marcus ───────────────────────────────────── */}
        <div
          className={`rounded-2xl border-2 transition-all ${
            activePanel === 'marcus'
              ? 'border-gray-900 bg-white shadow-lg'
              : hasVehicle
                ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md cursor-pointer'
                : 'border-gray-200 bg-gray-50/50 cursor-pointer'
          }`}
          onClick={() => { if (activePanel !== 'marcus') setActivePanel(hasVehicle ? 'marcus' : 'vehicle'); }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: hasVehicle ? `${accentColor}12` : '#f3f4f6' }}>🤖</div>
              <div>
                <h2 className={`font-bold ${hasVehicle ? 'text-gray-900' : 'text-gray-400'}`}>Ask Marcus</h2>
                <p className="text-xs text-gray-400">
                  {hasVehicle ? `AI diagnosis for ${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Set vehicle first'}
                </p>
              </div>
            </div>

            {!hasVehicle ? (
              activePanel === 'marcus' ? <LockedOverlay /> : (
                <div className="mt-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-400">🔒 Decode a vehicle first for diagnosis</span>
                </div>
              )
            ) : activePanel === 'marcus' ? (
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={marcusInput}
                  onChange={(e) => setMarcusInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleMarcusSubmit(); } }}
                  placeholder={"Describe the customer's issue...\n\ne.g. Grinding noise from front when braking at low speed. Started last week."}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-none"
                  rows={4}
                  autoFocus
                />
                <button onClick={handleMarcusSubmit} disabled={!marcusInput.trim()} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30" style={{ background: accentColor }}>
                  Ask Marcus →
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {['Brake noise', 'Check engine light', 'A/C not cold', 'Overheating', "Won't start", 'P0420 code'].map((q) => (
                    <button key={q} onClick={() => setMarcusInput(q)} className="px-2.5 py-1 text-[11px] text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors">
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

      {/* ── Keyboard Shortcut Hints ────────────────────────────────── */}
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

      {/* ── Related Parts Drawer ───────────────────────────────────── */}
      <RelatedPartsDrawer
        isOpen={drawerOpen}
        partLabel={drawerPartLabel}
        vehicle={vehicle}
        accentColor={accentColor}
        onSearch={handleDrawerSearch}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
