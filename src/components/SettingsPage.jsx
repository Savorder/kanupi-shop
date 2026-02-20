/**
 * SettingsPage — Manage shop profile and system settings.
 * 
 * Sections:
 *   1. Shop Profile — Name, address, phone, logo URL
 *   2. Branding — Accent color picker
 *   3. Defaults — Default markup %, tax rate
 * 
 * All data from /api/b2b/shop (GET + PUT).
 */

import { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import API from '../config/api';

const COLOR_PRESETS = [
  { label: 'Red',    value: '#dc2626' },
  { label: 'Blue',   value: '#2563eb' },
  { label: 'Green',  value: '#16a34a' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Teal',   value: '#0d9488' },
  { label: 'Slate',  value: '#475569' },
  { label: 'Rose',   value: '#e11d48' },
];

export default function SettingsPage() {
  const { shop, session, refreshShop } = useShop();
  const accentColor = shop?.accent_color || '#dc2626';
  const token = session?.access_token;

  // ── Form state ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    shop_name: '',
    address: '',
    phone: '',
    logo_url: '',
    accent_color: '#dc2626',
    default_markup_pct: 35,
    tax_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // ── Populate form from shop profile ─────────────────────────────
  useEffect(() => {
    if (shop) {
      const initial = {
        shop_name: shop.shop_name || '',
        address: shop.address || '',
        phone: shop.phone || '',
        logo_url: shop.logo_url || '',
        accent_color: shop.accent_color || '#dc2626',
        default_markup_pct: shop.default_markup_pct ?? 35,
        tax_rate: shop.tax_rate ?? 0,
      };
      setFormData(initial);
      setLoading(false);
    }
  }, [shop]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveMessage(null);
  };

  // ── Save profile ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!token) return;
    try {
      setSaving(true);
      setSaveMessage(null);

      const res = await fetch(API.b2b.shopProfile(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shop_name: formData.shop_name,
          address: formData.address,
          phone: formData.phone,
          logo_url: formData.logo_url,
          accent_color: formData.accent_color,
          default_markup_pct: parseFloat(formData.default_markup_pct) || 35,
          tax_rate: parseFloat(formData.tax_rate) || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save settings');
      }

      setSaveMessage({ type: 'success', text: 'Settings saved successfully' });
      setHasChanges(false);

      if (typeof refreshShop === 'function') {
        await refreshShop();
      }
    } catch (err) {
      console.error('[Settings] Save error:', err);
      setSaveMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-lg mx-auto px-6 py-8">
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your shop profile, branding, and defaults</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-30"
          style={{ background: accentColor }}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Save Changes'}
        </button>
      </div>

      {/* Save status message */}
      {saveMessage && (
        <div className={`mb-6 px-4 py-3 rounded-xl border text-sm font-medium ${
          saveMessage.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SHOP PROFILE                                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Shop Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Shop Name</label>
            <input
              type="text"
              value={formData.shop_name}
              onChange={(e) => handleChange('shop_name', e.target.value)}
              placeholder="Your shop name"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Main St, City, State ZIP"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Logo URL</label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="https://your-logo-url.com/logo.png"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>
          </div>

          {/* Logo preview */}
          {formData.logo_url && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <img
                src={formData.logo_url}
                alt="Logo preview"
                className="w-12 h-12 rounded-xl object-contain bg-white border border-gray-100"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="text-xs text-gray-500">Logo preview</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* BRANDING                                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Branding</h2>

        <div>
          <label className="block text-xs text-gray-500 font-medium mb-3">Accent Color</label>

          {/* Color presets */}
          <div className="flex items-center gap-2 mb-3">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleChange('accent_color', color.value)}
                className={`w-9 h-9 rounded-xl border-2 transition-all ${
                  formData.accent_color === color.value
                    ? 'border-gray-900 scale-110 shadow-md'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ background: color.value }}
                title={color.label}
              />
            ))}
          </div>

          {/* Custom color input */}
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={formData.accent_color}
              onChange={(e) => handleChange('accent_color', e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={formData.accent_color}
              onChange={(e) => handleChange('accent_color', e.target.value)}
              placeholder="#dc2626"
              className="w-32 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
            />
            <span className="text-xs text-gray-400">Custom hex color</span>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: formData.accent_color }}
              >
                {(formData.shop_name || 'S').charAt(0).toUpperCase()}
              </div>
              <button
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
                style={{ background: formData.accent_color }}
              >
                Sample Button
              </button>
              <span className="text-xs font-semibold" style={{ color: formData.accent_color }}>
                Accent Text
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DEFAULTS                                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Defaults</h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Default Markup (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.default_markup_pct}
                onChange={(e) => handleChange('default_markup_pct', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Applied when no category or brand-specific margin rule matches. Example: 35% markup on a $20 part = $27 list price.
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Tax Rate (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => handleChange('tax_rate', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Local sales tax rate. Applied to the customer-facing list price on invoices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
