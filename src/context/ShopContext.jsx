/**
 * ShopContext — Global state for the B2B shop dashboard.
 * 
 * Manages:
 *   - Authentication (Supabase auth + shop_id linkage)
 *   - Shop profile (name, branding, settings)
 *   - Margin rules (for list price calculations)
 *   - Brand preferences (pinned, excluded, tier overrides)
 *   - Vehicle context (current decoded vehicle)
 * 
 * All child components access this via useShop() hook.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../utils/supabaseClient';

const ShopContext = createContext(null);

/** @returns {ShopContextValue} */
export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}

export function ShopProvider({ children }) {
  // ── Auth state ──────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Shop profile ────────────────────────────────────────────────
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);

  // ── Margin rules ────────────────────────────────────────────────
  const [marginRules, setMarginRules] = useState([]);

  // ── Brand preferences ───────────────────────────────────────────
  const [brandPreferences, setBrandPreferences] = useState([]);

  // ── Vehicle context (current working vehicle) ───────────────────
  const [vehicle, setVehicle] = useState(null);

  // ── Auth listener ───────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Load shop data when user authenticates ──────────────────────
  useEffect(() => {
    if (user) {
      loadShopData(user.id);
    } else {
      setShop(null);
      setMarginRules([]);
      setBrandPreferences([]);
    }
  }, [user]);

  const loadShopData = useCallback(async (userId) => {
    setShopLoading(true);
    try {
      // Get shop linkage
      const { data: authLink, error: authError } = await supabase
        .from('b2b_shop_auth')
        .select('shop_id')
        .eq('user_id', userId)
        .single();

      if (authError || !authLink) {
        console.warn('[ShopContext] No shop linked to user:', authError?.message);
        setShopLoading(false);
        return;
      }

      const shopId = authLink.shop_id;

      // Load shop profile, margin rules, and brand prefs in parallel
      const [shopRes, rulesRes, prefsRes] = await Promise.all([
        supabase.from('b2b_shops').select('*').eq('id', shopId).single(),
        supabase.from('b2b_margin_rules').select('*').eq('shop_id', shopId).order('priority', { ascending: false }),
        supabase.from('b2b_brand_preferences').select('*').eq('shop_id', shopId).order('sort_order', { ascending: true }),
      ]);

      if (shopRes.data) {
        setShop(shopRes.data);
        // Apply shop accent color as CSS variable
        document.documentElement.style.setProperty('--shop-accent', shopRes.data.accent_color || '#dc2626');
      }

      setMarginRules(rulesRes.data || []);
      setBrandPreferences(prefsRes.data || []);
    } catch (err) {
      console.error('[ShopContext] Failed to load shop data:', err);
    } finally {
      setShopLoading(false);
    }
  }, []);

  // ── Auth methods ────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setShop(null);
    setMarginRules([]);
    setBrandPreferences([]);
    setVehicle(null);
  }, []);

  // ── Vehicle methods ─────────────────────────────────────────────
  const setVehicleContext = useCallback((vehicleData) => {
    setVehicle(vehicleData);
  }, []);

  const clearVehicle = useCallback(() => {
    setVehicle(null);
  }, []);

  // ── Computed values ─────────────────────────────────────────────
  const isAuthenticated = !!user && !!shop;
  const isLoading = authLoading || shopLoading;

  // Brand prefs by status for quick access
  const pinnedBrands = brandPreferences.filter((b) => b.status === 'pinned').map((b) => b.brand_name);
  const excludedBrands = brandPreferences.filter((b) => b.status === 'excluded').map((b) => b.brand_name);

  /** @type {ShopContextValue} */
  const value = {
    // Auth
    user,
    session,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,

    // Shop
    shop,
    shopLoading,

    // Margin
    marginRules,
    setMarginRules,

    // Brand preferences
    brandPreferences,
    setBrandPreferences,
    pinnedBrands,
    excludedBrands,

    // Vehicle
    vehicle,
    setVehicleContext,
    clearVehicle,

    // Reload
    reloadShopData: () => user && loadShopData(user.id),
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}
