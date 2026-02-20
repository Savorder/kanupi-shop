/**
 * API Configuration for Kanupi Shop Dashboard
 * 
 * Points to the shared kanupi-backend on Railway.
 * All B2B-specific endpoints are under /api/b2b/*
 * Existing consumer endpoints (vehicles, parts, AI) are reused directly.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://kanupi-backend-production.up.railway.app';

const API = {
  baseUrl: API_BASE_URL,

  // ── Vehicle endpoints (existing) ──────────────────────────────────────────
  vehicles: {
    decodeVin: (vin) => `${API_BASE_URL}/api/vehicles/vin/${vin}`,
    decodePlate: () => `${API_BASE_URL}/api/vehicles/plate`,
    yearMakeModel: () => `${API_BASE_URL}/api/vehicles`,
    years: () => `${API_BASE_URL}/api/vehicles/years`,
    makes: (year) => `${API_BASE_URL}/api/vehicles/makes?year=${year}`,
    models: (year, make) => `${API_BASE_URL}/api/vehicles/models?year=${year}&make=${encodeURIComponent(make)}`,
    trims: (year, make, model) => `${API_BASE_URL}/api/vehicles/trims?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    engines: (year, make, model) => `${API_BASE_URL}/api/vehicles/engines?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
  },

  // ── Parts search endpoints (existing) ─────────────────────────────────────
  parts: {
    search: () => `${API_BASE_URL}/api/parts/search`,
    searchProject: () => `${API_BASE_URL}/api/parts/search-project`,
  },

  // ── AI / Marcus endpoints (existing) ──────────────────────────────────────
  ai: {
    diagnose: () => `${API_BASE_URL}/api/ai/diagnose-conversation`,
  },

  // ── B2B Shop endpoints (new) ──────────────────────────────────────────────
  b2b: {
    shopProfile: () => `${API_BASE_URL}/api/b2b/shop`,
    marginRules: () => `${API_BASE_URL}/api/b2b/margin-rules`,
    marginRule: (id) => `${API_BASE_URL}/api/b2b/margin-rules/${id}`,
    brandPreferences: () => `${API_BASE_URL}/api/b2b/brand-preferences`,
    brandPreference: (id) => `${API_BASE_URL}/api/b2b/brand-preferences/${id}`,
    searchHistory: () => `${API_BASE_URL}/api/b2b/search-history`,
    orders: () => `${API_BASE_URL}/api/b2b/orders`,
    order: (id) => `${API_BASE_URL}/api/b2b/orders/${id}`,
    analytics: () => `${API_BASE_URL}/api/b2b/analytics`,
  },
};

export default API;
