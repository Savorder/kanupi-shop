/**
 * ShopHeader — White-label header bar for the B2B dashboard.
 * 
 * Displays:
 *   - Shop logo/monogram with accent color
 *   - Shop name + "Powered by Kanupi"
 *   - Navigation links: Order History, Preferences, Settings
 *   - Sign out
 * 
 * Reads shop data from ShopContext. Accent color is dynamic per shop.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function ShopHeader() {
  const { shop, signOut } = useShop();
  const navigate = useNavigate();
  const location = useLocation();

  const safeShop = shop || {};
  const shopName = safeShop.shop_name || 'Shop Dashboard';
  const accentColor = safeShop.accent_color || '#dc2626';

  // Generate monogram from shop name (first letter of first two words)
  const monogram = shopName
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/orders', label: 'Order History' },
    { path: '/settings', label: 'Settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Logo + Shop Name */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          {safeShop.logo_url ? (
            <img
              src={safeShop.logo_url}
              alt={shopName}
              className="w-10 h-10 rounded-xl object-contain"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{ background: accentColor }}
            >
              {monogram}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900 text-sm leading-tight">
              {shopName}
            </div>
            <div className="text-[11px] text-gray-400">Powered by Kanupi</div>
          </div>
        </div>

        {/* Right: Navigation + Sign Out */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <button
            onClick={handleSignOut}
            className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-600 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
