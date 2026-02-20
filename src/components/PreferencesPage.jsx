/**
 * PreferencesPage — AI-powered preference management.
 * 
 * Primary interface: Natural language input powered by Marcus AI.
 * Users type preferences in plain English, Marcus parses them into
 * structured rules, shows a confirmation card, and applies on approval.
 * 
 * Examples:
 *   "I don't like Wagner" → Exclude Wagner from all results
 *   "Only show Bosch for front brake pads" → Prefer Bosch, category: brakes
 *   "40% markup on everything" → Global margin rule, 35%
 *   "Never show Duralast or Valucraft" → Two excluded brand preferences
 *   "50% markup on premium brands, 35% on economy" → Two margin rules
 * 
 * Two sections below the input:
 *   1. Active Brand Preferences — with inline status toggles
 *   2. Active Margin Rules — with edit/delete
 * 
 * All CRUD via existing /api/b2b/ endpoints.
 * AI parsing via POST /api/b2b/preferences/parse + /api/b2b/preferences/apply.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import API from '../config/api';

const RULE_TYPE_LABELS = {
  global: 'Global',
  category: 'Category',
  brand: 'Brand',
};

const PREFERENCE_STATUS_STYLES = {
  preferred: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Preferred' },
  neutral:   { bg: 'bg-gray-50',  text: 'text-gray-600',  border: 'border-gray-200', label: 'Neutral' },
  excluded:  { bg: 'bg-red-50',   text: 'text-red-600',   border: 'border-red-200',  label: 'Excluded' },
};

const SUGGESTION_CHIPS = [
  'Exclude Wagner from brakes',
  'Only show Akebono for brake pads',
  '40% markup on everything',
  'I prefer Denso and NGK for ignition',
  'Never show economy brands',
  '50% markup on premium, 30% on economy',
];

export default function PreferencesPage() {
  const { shop, session } = useShop();
  const accentColor = shop?.accent_color || '#dc2626';
  const token = session?.access_token;
  const inputRef = useRef(null);

  // ── AI input state ──────────────────────────────────────────────
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [applying, setApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // ── Existing rules state ────────────────────────────────────────
  const [marginRules, setMarginRules] = useState([]);
  const [brandPrefs, setBrandPrefs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Edit state for margin rules ─────────────────────────────────
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  const authHeaders = token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };

  // ── Load existing rules ─────────────────────────────────────────
  const loadAllRules = useCallback(async () => {
    if (!token) return;
    try {
      setDataLoading(true);
      const [marginRes, brandRes] = await Promise.allSettled([
        fetch(API.b2b.marginRules(), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API.b2b.brandPreferences(), { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (marginRes.status === 'fulfilled' && marginRes.value.ok) {
        const data = await marginRes.value.json();
        setMarginRules(data.rules || []);
      }
      if (brandRes.status === 'fulfilled' && brandRes.value.ok) {
        const data = await brandRes.value.json();
        setBrandPrefs(data.preferences || []);
      }
    } catch (err) {
      console.error('[Preferences] Load error:', err);
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => { loadAllRules(); }, [loadAllRules]);

  // ── AI Parse ────────────────────────────────────────────────────
  const handleParse = async () => {
    if (!inputText.trim() || parsing) return;

    try {
      setParsing(true);
      setParsedResult(null);
      setSuccessMessage(null);

      const res = await fetch(`${API.baseUrl}/api/b2b/preferences/parse`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text: inputText.trim() }),
      });

      if (!res.ok) throw new Error('Failed to parse preference');
      const data = await res.json();

      setParsedResult({
        understood: data.understood,
        summary: data.summary,
        rules: data.rules || [],
      });
    } catch (err) {
      console.error('[Preferences] Parse error:', err);
      setParsedResult({
        understood: false,
        summary: 'Something went wrong. Please try again.',
        rules: [],
      });
    } finally {
      setParsing(false);
    }
  };

  // ── Apply confirmed rules ───────────────────────────────────────
  const handleApply = async () => {
    if (!parsedResult?.rules?.length || applying) return;

    try {
      setApplying(true);

      const res = await fetch(`${API.baseUrl}/api/b2b/preferences/apply`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ rules: parsedResult.rules }),
      });

      if (!res.ok) throw new Error('Failed to apply preferences');
      const data = await res.json();

      setSuccessMessage(`Applied ${data.applied} rule${data.applied !== 1 ? 's' : ''} successfully`);
      setParsedResult(null);
      setInputText('');
      await loadAllRules();

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('[Preferences] Apply error:', err);
      alert('Failed to apply preferences. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // ── Cancel parsed result ────────────────────────────────────────
  const handleCancel = () => {
    setParsedResult(null);
    inputRef.current?.focus();
  };

  // ── Delete brand preference ─────────────────────────────────────
  const handleDeleteBrand = async (id) => {
    if (!confirm('Remove this brand preference?')) return;
    try {
      await fetch(API.b2b.brandPreference(id), {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      await loadAllRules();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  // ── Update brand status inline ──────────────────────────────────
  const handleUpdateBrandStatus = async (id, newStatus) => {
    try {
      await fetch(API.b2b.brandPreference(id), {
        method: 'PUT', headers: authHeaders, body: JSON.stringify({ status: newStatus }),
      });
      await loadAllRules();
    } catch (err) {
      alert('Failed to update');
    }
  };

  // ── Margin rule CRUD ────────────────────────────────────────────
  const handleUpdateMarginRule = async () => {
    if (!editingRuleId || !editingRule) return;
    try {
      await fetch(API.b2b.marginRule(editingRuleId), {
        method: 'PUT', headers: authHeaders, body: JSON.stringify(editingRule),
      });
      setEditingRuleId(null);
      setEditingRule(null);
      await loadAllRules();
    } catch (err) {
      alert('Failed to update');
    }
  };

  const handleDeleteMarginRule = async (id) => {
    if (!confirm('Delete this margin rule?')) return;
    try {
      await fetch(API.b2b.marginRule(id), {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      await loadAllRules();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  // ── Render a parsed rule preview ────────────────────────────────
  const renderRulePreview = (rule, index) => {
    if (rule.type === 'brand_preference') {
      const style = PREFERENCE_STATUS_STYLES[rule.status] || PREFERENCE_STATUS_STYLES.neutral;
      return (
        <div key={index} className="flex items-center gap-3 py-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${style.bg} ${style.text} ${style.border}`}>
            {style.label}
          </span>
          <span className="text-sm font-semibold text-gray-800">{rule.brand_name}</span>
          {rule.category && (
            <span className="text-[11px] text-gray-400">in {rule.category}</span>
          )}
        </div>
      );
    }

    if (rule.type === 'margin_rule') {
      return (
        <div key={index} className="flex items-center gap-3 py-2">
          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">
            Margin
          </span>
          <span className="text-sm font-bold text-gray-800">
            {rule.markup_type === 'percentage' ? `${rule.markup_value}%` : `$${rule.markup_value}`}
          </span>
          <span className="text-[11px] text-gray-400">
            {rule.rule_type === 'global' ? 'on all parts' : ''}
            {rule.rule_type === 'category' ? `on ${rule.category}` : ''}
            {rule.rule_type === 'brand' ? `for ${rule.brand}` : ''}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
        <p className="text-sm text-gray-400 mt-1">Tell Marcus how you want your shop configured — in plain English</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* AI INPUT — Primary interface                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${accentColor}12` }}>
            🤖
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Ask Marcus</h2>
            <p className="text-xs text-gray-400">Describe your preferences and Marcus will set them up</p>
          </div>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <span className="text-green-600 text-sm">✓</span>
            <span className="text-sm font-medium text-green-700">{successMessage}</span>
          </div>
        )}

        {/* Input area */}
        {!parsedResult && (
          <>
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleParse();
                  }
                }}
                placeholder={'Tell Marcus your preferences...\n\ne.g. "Exclude Wagner from brakes" or "Set 40% markup on everything"'}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-none"
                rows={3}
                disabled={parsing}
              />
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => { setInputText(chip); inputRef.current?.focus(); }}
                    className="px-2.5 py-1 text-[11px] text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <button
                onClick={handleParse}
                disabled={!inputText.trim() || parsing}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-30 flex-shrink-0 ml-4"
                style={{ background: accentColor }}
              >
                {parsing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Thinking...
                  </span>
                ) : 'Apply →'}
              </button>
            </div>
          </>
        )}

        {/* ── Confirmation Card ─────────────────────────────────────── */}
        {parsedResult && (
          <div className={`rounded-xl border-2 p-5 ${
            parsedResult.understood
              ? 'border-green-200 bg-green-50/50'
              : 'border-amber-200 bg-amber-50/50'
          }`}>
            {/* Marcus avatar + summary */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${accentColor}20` }}>
                🤖
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{parsedResult.summary}</p>
              </div>
            </div>

            {/* Rule previews */}
            {parsedResult.rules.length > 0 && (
              <div className="mb-4 pl-12">
                <div className="border-l-2 border-gray-200 pl-4">
                  {parsedResult.rules.map((rule, i) => renderRulePreview(rule, i))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pl-12">
              {parsedResult.understood && parsedResult.rules.length > 0 ? (
                <>
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition-all disabled:opacity-50"
                    style={{ background: accentColor }}
                  >
                    {applying ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Applying...
                      </span>
                    ) : `Confirm ${parsedResult.rules.length} rule${parsedResult.rules.length !== 1 ? 's' : ''}`}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ACTIVE BRAND PREFERENCES                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Brand Preferences</h2>
            <p className="text-xs text-gray-400 mt-0.5">{brandPrefs.length} active rule{brandPrefs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {dataLoading ? (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[11px] text-gray-400">Loading...</p>
          </div>
        ) : brandPrefs.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-gray-400">No brand preferences yet. Tell Marcus above — e.g. "I prefer Akebono for brakes"</p>
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
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium border cursor-pointer appearance-none pr-5 ${style.bg} ${style.text} ${style.border}`}
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23999\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                    >
                      <option value="preferred">Preferred</option>
                      <option value="neutral">Neutral</option>
                      <option value="excluded">Excluded</option>
                    </select>
                    {pref.category && (
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">
                        {pref.category}
                      </span>
                    )}
                    {pref.notes && <span className="text-[11px] text-gray-400 italic">{pref.notes}</span>}
                  </div>
                  <button
                    onClick={() => handleDeleteBrand(pref.id)}
                    className="px-2 py-1 text-[11px] text-gray-300 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ACTIVE MARGIN RULES                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Margin Rules</h2>
            <p className="text-xs text-gray-400 mt-0.5">{marginRules.length} active rule{marginRules.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {dataLoading ? (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[11px] text-gray-400">Loading...</p>
          </div>
        ) : marginRules.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-gray-400">No margin rules yet. Tell Marcus above — e.g. "40% markup on everything"</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {marginRules.map((rule) => {
              const isEditing = editingRuleId === rule.id;

              return (
                <div key={rule.id} className="py-3 flex items-center justify-between">
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-3 mr-4">
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
                        className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                      />
                      {editingRule.rule_type === 'brand' && (
                        <input
                          type="text"
                          value={editingRule.brand || ''}
                          onChange={(e) => setEditingRule({ ...editingRule, brand: e.target.value })}
                          placeholder="Brand"
                          className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                        />
                      )}
                      {editingRule.rule_type === 'category' && (
                        <input
                          type="text"
                          value={editingRule.category || ''}
                          onChange={(e) => setEditingRule({ ...editingRule, category: e.target.value })}
                          placeholder="Category"
                          className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                        />
                      )}
                      <button onClick={handleUpdateMarginRule} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: accentColor }}>Save</button>
                      <button onClick={() => { setEditingRuleId(null); setEditingRule(null); }} className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
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
                          className="px-2 py-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMarginRule(rule.id)}
                          className="px-2 py-1 text-[11px] text-gray-300 hover:text-red-500 transition-colors"
                        >
                          ✕
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
    </div>
  );
}
