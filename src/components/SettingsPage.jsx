/**
 * SettingsPage — Manage shop profile and system settings.
 * 
 * Sections:
 *   1. Shop Profile — Name, address, phone
 *   2. Shop Logo — Drag-and-drop upload (stored in Supabase Storage)
 *   3. Branding — Accent color picker with presets
 *   4. Defaults — Default markup %, tax rate
 * 
 * Profile data via GET/PUT /api/b2b/shop.
 * Logo upload via POST /api/b2b/shop/logo (multipart).
 * Logo delete via DELETE /api/b2b/shop/logo.
 */

import { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef(null);

  // ── Form state ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    shop_name: '',
    address: '',
    phone: '',
    accent_color: '#dc2626',
    default_markup_pct: 35,
    tax_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // ── Logo upload state ───────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Populate form from shop profile ─────────────────────────────
  useEffect(() => {
    if (shop) {
      setFormData({
        shop_name: shop.shop_name || '',
        address: shop.address || '',
        phone: shop.phone || '',
        accent_color: shop.accent_color || '#dc2626',
        default_markup_pct: shop.default_markup_pct ?? 35,
        tax_rate: shop.tax_rate ?? 0,
      });
      setLogoUrl(shop.logo_url || null);
      setLoading(false);
    }
  }, [shop]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveMessage(null);
  };

  // ── Save profile (excludes logo — that's handled separately) ────
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

  // ── Logo upload ─────────────────────────────────────────────────
  const handleLogoUpload = async (file) => {
    if (!file || !token) return;

    // Validate on frontend too
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setLogoError('Please upload a PNG, JPG, WebP, SVG, or GIF file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File must be under 2 MB');
      return;
    }

    try {
      setLogoUploading(true);
      setLogoError(null);

      const formPayload = new FormData();
      formPayload.append('logo', file);

      const res = await fetch(`${API.baseUrl}/api/b2b/shop/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formPayload,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      const data = await res.json();
      setLogoUrl(data.logo_url);
      setSaveMessage({ type: 'success', text: 'Logo uploaded and saved' });
      setTimeout(() => setSaveMessage(null), 4000);

      if (typeof refreshShop === 'function') {
        await refreshShop();
      }
    } catch (err) {
      console.error('[Settings] Logo upload error:', err);
      setLogoError(err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!token || !confirm('Remove your shop logo?')) return;

    try {
      setLogoUploading(true);
      setLogoError(null);

      const res = await fetch(`${API.baseUrl}/api/b2b/shop/logo`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to remove logo');

      setLogoUrl(null);
      setSaveMessage({ type: 'success', text: 'Logo removed' });
      setTimeout(() => setSaveMessage(null), 4000);

      if (typeof refreshShop === 'function') {
        await refreshShop();
      }
    } catch (err) {
      console.error('[Settings] Logo remove error:', err);
      setLogoError(err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  // ── Drag and drop handlers ──────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) handleLogoUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleLogoUpload(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Loading state ───────────────────────────────────────────────
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

  // ── Monogram fallback ───────────────────────────────────────────
  const monogram = (formData.shop_name || 'S')
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SHOP LOGO                                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Shop Logo</h2>

        {logoUrl ? (
          /* ── Current logo preview ─────────────────────────────── */
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src={logoUrl}
                alt="Shop logo"
                className="w-full h-full object-contain p-1"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-1">Current Logo</p>
              <p className="text-[11px] text-gray-400 mb-3">Displayed in the header and on customer-facing pages</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Replace
                </button>
                <button
                  onClick={handleLogoRemove}
                  disabled={logoUploading}
                  className="px-4 py-1.5 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  {logoUploading ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Drag-and-drop upload zone ────────────────────────── */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => { if (!logoUploading) fileInputRef.current?.click(); }}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-400 bg-blue-50/50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
            }`}
          >
            {logoUploading ? (
              <div>
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${accentColor}12` }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: accentColor }}
                  >
                    {monogram}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {dragOver ? 'Drop your logo here' : 'Drop your logo here, or click to browse'}
                </p>
                <p className="text-[11px] text-gray-400">
                  PNG, JPG, WebP, SVG, or GIF — Max 2 MB
                </p>
                <p className="text-[11px] text-gray-300 mt-2">
                  Currently using monogram "{monogram}" from your shop name
                </p>
              </>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload error */}
        {logoError && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{logoError}</p>
          </div>
        )}
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
                {monogram}
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
