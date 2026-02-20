/**
 * PreferencesPage — Manage margin rules and brand preferences.
 * 
 * Two sections:
 *   1. Margin Rules — Global, category, and brand-specific markup rules
 *   2. Brand Preferences — Excluded brands and preferred/blocked settings
 * 
 * All data from /api/b2b/margin-rules and /api/b2b/brand-preferences.
 */

import { useState, useEffect, useCallback } from 'react';
import { useShop } from '../context/ShopContext';
import API from '../config/api';

const RULE_TYPE_LABELS = {
  global: 'Global Default',
  category: 'By Category',
  brand: 'By Brand',
};

const PREFERENCE_STATUS_STYLES = {
  preferred: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  neutral:   { bg: 'bg-gray-50',  text: 'text-gray-600',  border: 'border-gray-200' },
  excluded:  { bg: 'bg-red-50',   text: 'text-red-600',   border: 'border-red-200' },
};

export default function PreferencesPage() {
  const { shop, session } = useShop();
  const accentColor = shop?.accent_color || '#dc2626';
  const token = session?.access_token;

  // ── Margin Rules state ──────────────────────────────────────────
  const [marginRules, setMarginRules] = useState([]);
  const [marginLoading, setMarginLoading] = useState(true);
  const [marginError, setMarginError] = useState(null);
  const [showAddMarginRule, setShowAddMarginRule] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_type: 'global', markup_type: 'percentage', markup_value: 35, brand: '', category: '', priority: 10,
  });
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  // ── Brand Preferences state ─────────────────────────────────────
  const [brandPrefs, setBrandPrefs] = useState([]);
  const [brandLoading, setBrandLoading] = useState(true);
  const [brandError, setBrandError] = useState(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrand, setNewBrand] = useState({ brand_name: '', status: 'preferred', notes: '' });

  const headers = token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };

  // ── Load margin rules ───────────────────────────────────────────
  const loadMarginRules = useCallback(async () => {
    if (!token) return;
    try {
      setMarginLoading(true);
      const res = await fetch(API.b2b.marginRules(), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load margin rules');
      const data = await res.json();
      setMarginRules(data.rules || []);
      setMarginError(null);
    } catch (err) {
      console.error('[Preferences] Margin rules error:', err);
      setMarginError(err.message);
    } finally {
      setMarginLoading(false);
    }
  }, [token]);

  // ── Load brand preferences ──────────────────────────────────────
  const loadBrandPrefs = useCallback(async () => {
    if (!token) return;
    try {
      setBrandLoading(true);
      const res = await fetch(API.b2b.brandPreferences(), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load brand preferences');
      const data = await res.json();
      setBrandPrefs(data.preferences || []);
      setBrandError(null);
    } catch (err) {
      console.error('[Preferences] Brand preferences error:', err);
      setBrandError(err.message);
    } finally {
      setBrandLoading(false);
    }
  }, [token]);

  useEffect(() => { loadMarginRules(); }, [loadMarginRules]);
  useEffect(() => { loadBrandPrefs(); }, [loadBrandPrefs]);

  // ── Margin rule CRUD ────────────────────────────────────────────
  const handleCreateMarginRule = async () => {
    try {
      const res = await fetch(API.b2b.marginRules(), {
        method: 'POST', headers, body: JSON.stringify(newRule),
      });
      if (!res.ok) throw new Error('Failed to create rule');
      setShowAddMarginRule(false);
      setNewRule({ rule_type: 'global', markup_type: 'percentage', markup_value: 35, brand: '', category: '', priority: 10 });
      await loadMarginRules();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateMarginRule = async () => {
    if (!editingRuleId || !editingRule) return;
    try {
      const res = await fetch(API.b2b.marginRule(editingRuleId), {
        method: 'PUT', headers, body: JSON.stringify(editingRule),
      });
      if (!res.ok) throw new Error('Failed to update rule');
      setEditingRuleId(null);
      setEditingRule(null);
      await loadMarginRules();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMarginRule = async (id) => {
    if (!confirm('Delete this margin rule?')) return;
    try {
      const res = await fetch(API.b2b.marginRule(id), {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete rule');
      await loadMarginRules();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Brand preference CRUD ───────────────────────────────────────
  const handleCreateBrandPref = async () => {
    if (!newBrand.brand_name.trim()) return;
    try {
      const res = await fetch(API.b2b.brandPreferences(), {
        method: 'POST', headers, body: JSON.stringify(newBrand),
      });
      if (!res.ok) throw new Error('Failed to create brand preference');
      setShowAddBrand(false);
      setNewBrand({ brand_name: '', status: 'preferred', notes: '' });
      await loadBrandPrefs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteBrandPref = async (id) => {
    if (!confirm('Remove this brand preference?')) return;
    try {
      const res = await fetch(API.b2b.brandPreference(id), {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete brand preference');
      await loadBrandPrefs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateBrandStatus = async (id, newStatus) => {
    try {
      const res = await fetch(API.b2b.brandPreference(id), {
        method: 'PUT', headers, body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update brand preference');
      await loadBrandPrefs();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
        <p className="text-sm text-gray-400 mt-1">Manage margin rules and brand preferences for your shop</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MARGIN RULES                                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Margin Rules</h2>
            <p className="text-xs text-gray-400 mt-0.5">Define how markup is calculated for parts</p>
          </div>
          <button
            onClick={() => setShowAddMarginRule(!showAddMarginRule)}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors"
            style={{ background: accentColor }}
          >
            {showAddMarginRule ? 'Cancel' : '+ Add Rule'}
          </button>
        </div>

        {/* Add new rule form */}
        {showAddMarginRule && (
          <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Rule Type</label>
                <select
                  value={newRule.rule_type}
                  onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
                >
                  <option value="global">Global Default</option>
                  <option value="category">By Category</option>
                  <option value="brand">By Brand</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Markup Type</label>
                <select
                  value={newRule.markup_type}
                  onChange={(e) => setNewRule({ ...newRule, markup_type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">
                  Markup Value {newRule.markup_type === 'percentage' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  value={newRule.markup_value}
                  onChange={(e) => setNewRule({ ...newRule, markup_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Priority</label>
                <input
                  type="number"
                  value={newRule.priority}
                  onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>

            {newRule.rule_type === 'brand' && (
              <div className="mb-3">
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Brand Name</label>
                <input
                  type="text"
                  value={newRule.brand}
                  onChange={(e) => setNewRule({ ...newRule, brand: e.target.value })}
                  placeholder="e.g. Akebono, Wagner, Duralast"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
                />
              </div>
            )}

            {newRule.rule_type === 'category' && (
              <div className="mb-3">
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={newRule.category}
                  onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                  placeholder="e.g. Brakes, Suspension, Engine"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
                />
              </div>
            )}

            <button
              onClick={handleCreateMarginRule}
              className="px-5 py-2 text-xs font-semibold rounded-lg text-white transition-colors"
              style={{ background: accentColor }}
            >
              Save Rule
            </button>
          </div>
        )}

        {/* Rules list */}
        {marginLoading ? (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[11px] text-gray-400">Loading margin rules...</p>
          </div>
        ) : marginError ? (
          <div className="py-6 text-center">
            <p className="text-xs text-red-500">{marginError}</p>
            <button onClick={loadMarginRules} className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline">Retry</button>
          </div>
        ) : marginRules.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-2xl mb-2">📐</div>
            <p className="text-xs text-gray-400">No margin rules yet. Add one to start calculating margins automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {marginRules.map((rule) => {
              const isEditing = editingRuleId === rule.id;

              return (
                <div key={rule.id} className="py-3 flex items-center justify-between">
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-4 gap-3 mr-4">
                      <select
                        value={editingRule.rule_type}
                        onChange={(e) => setEditingRule({ ...editingRule, rule_type: e.target.value })}
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                      >
                        <option value="global">Global</option>
                        <option value="category">Category</option>
                        <option value="brand">Brand</option>
                      </select>
                      <select
                        value={editingRule.markup_type}
                        onChange={(e) => setEditingRule({ ...editingRule, markup_type: e.target.value })}
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">$</option>
                      </select>
                      <input
                        type="number"
                        value={editingRule.markup_value}
                        onChange={(e) => setEditingRule({ ...editingRule, markup_value: parseFloat(e.target.value) || 0 })}
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleUpdateMarginRule} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: accentColor }}>Save</button>
                        <button onClick={() => { setEditingRuleId(null); setEditingRule(null); }} className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium uppercase">
                          {RULE_TYPE_LABELS[rule.rule_type] || rule.rule_type}
                        </span>
                        {rule.brand && <span className="text-sm text-gray-700 font-medium">{rule.brand}</span>}
                        {rule.category && <span className="text-sm text-gray-700 font-medium">{rule.category}</span>}
                        <span className="text-sm font-bold text-gray-900">
                          {rule.markup_type === 'percentage' ? `${rule.markup_value}%` : `$${rule.markup_value}`}
                        </span>
                        <span className="text-[10px] text-gray-400">Priority: {rule.priority}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingRuleId(rule.id); setEditingRule({ ...rule }); }}
                          className="px-2.5 py-1 text-[11px] text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMarginRule(rule.id)}
                          className="px-2.5 py-1 text-[11px] text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* BRAND PREFERENCES                                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Brand Preferences</h2>
            <p className="text-xs text-gray-400 mt-0.5">Prefer or exclude specific brands from results</p>
          </div>
          <button
            onClick={() => setShowAddBrand(!showAddBrand)}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors"
            style={{ background: accentColor }}
          >
            {showAddBrand ? 'Cancel' : '+ Add Brand'}
          </button>
        </div>

        {/* Add brand form */}
        {showAddBrand && (
          <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Brand Name</label>
                <input
                  type="text"
                  value={newBrand.brand_name}
                  onChange={(e) => setNewBrand({ ...newBrand, brand_name: e.target.value })}
                  placeholder="e.g. Akebono, Wagner"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Status</label>
                <select
                  value={newBrand.status}
                  onChange={(e) => setNewBrand({ ...newBrand, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
                >
                  <option value="preferred">Preferred</option>
                  <option value="neutral">Neutral</option>
                  <option value="excluded">Excluded</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={newBrand.notes}
                  onChange={(e) => setNewBrand({ ...newBrand, notes: e.target.value })}
                  placeholder="Why this preference?"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
            <button
              onClick={handleCreateBrandPref}
              disabled={!newBrand.brand_name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-30"
              style={{ background: accentColor }}
            >
              Save Brand Preference
            </button>
          </div>
        )}

        {/* Brand list */}
        {brandLoading ? (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[11px] text-gray-400">Loading brand preferences...</p>
          </div>
        ) : brandError ? (
          <div className="py-6 text-center">
            <p className="text-xs text-red-500">{brandError}</p>
            <button onClick={loadBrandPrefs} className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline">Retry</button>
          </div>
        ) : brandPrefs.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-2xl mb-2">🏷️</div>
            <p className="text-xs text-gray-400">No brand preferences set. Add preferred or excluded brands to customize results.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {brandPrefs.map((pref) => {
              const style = PREFERENCE_STATUS_STYLES[pref.status] || PREFERENCE_STATUS_STYLES.neutral;

              return (
                <div key={pref.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">{pref.brand_name}</span>
                    <select
                      value={pref.status}
                      onChange={(e) => handleUpdateBrandStatus(pref.id, e.target.value)}
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium border cursor-pointer ${style.bg} ${style.text} ${style.border}`}
                    >
                      <option value="preferred">Preferred</option>
                      <option value="neutral">Neutral</option>
                      <option value="excluded">Excluded</option>
                    </select>
                    {pref.notes && <span className="text-[11px] text-gray-400">{pref.notes}</span>}
                  </div>
                  <button
                    onClick={() => handleDeleteBrandPref(pref.id)}
                    className="px-2.5 py-1 text-[11px] text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
