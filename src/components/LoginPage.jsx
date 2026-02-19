/**
 * LoginPage — Authentication screen for shop users.
 * 
 * Clean login form with Kanupi car logo branding.
 * Uses Supabase email/password auth.
 * After successful login, ShopContext loads the shop profile
 * and App.jsx redirects to the dashboard.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

function KanupiLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 72.47 46.35" className={className}>
      <path fill="#C8102E" d="M44.06,33.67c-4.05,0-8.27,0-12.34-.01.34.98.52,2.03.52,3.12,0,1-.15,1.98-.44,2.89,3.98,0,8.12.01,12.19.01-.29-.92-.44-1.89-.44-2.9,0-1.09.18-2.13.51-3.11ZM70.97,20.76c-1.34-6.22-11.47-7.33-16.52-9.58-4.53-1.79-9.41-5.75-13.47-7.97C38.48,1.32,35.97.11,32.45.08c-6.15.17-13.94-.57-19.97.6-3.35.52-5.17,3.36-7.43,5.92-1.44,1.76-2.41,3.92-3.38,5.92C.33,15.28.17,15.96.05,18.96c-.22,4.39.29,9.33,1.13,13.6.9,4,2.52,6.9,6.58,7.08,1.43,0,3.28.01,5.44.01-.28-.91-.43-1.87-.43-2.87,0-1.1.18-2.16.52-3.14-1.39,0-2.56-.01-3.46-.01-1.78-.08-2.31-.66-2.73-2.71-.44-3.46-1.53-9.56-.73-13.65.93-3.53,3.21-7.22,6-9.7,1.68-1.34,3.82-1.46,5.93-1.5,3.83-.01,9.82-.04,13.52.03,2.24.05,4.34.24,6.17,1.49,2.82,2.1,6.38,4.99,9.79,6.69l.1.06c1.79,1.06,4.39,2.15,6.62,3.16,3.36,1.56,7.4,1.81,9.77,4.56,1.61,2.01,1.82,5.49,1.93,8.22.06,1.76-.23,3.43-2.17,3.35-.47,0-.98.01-1.53.01.34.98.52,2.04.52,3.14,0,1-.15,1.96-.43,2.87,1.56-.01,3.03-.01,4.38-.02,2.29-.3,3.99-1.11,4.87-3.8l.04-.12c1.2-4.38.39-10.63-.91-14.95Z"/>
      <path fill="none" stroke="#C8102E" strokeMiterlimit="10" strokeWidth="6" d="M29.39,36.78c0,.67-.11,1.34-.31,1.95-.86,2.68-3.47,4.62-6.54,4.62s-5.67-1.95-6.54-4.63c-.2-.61-.3-1.26-.3-1.94,0-.74.13-1.46.37-2.12.92-2.59,3.47-4.45,6.48-4.45s5.57,1.87,6.48,4.47c.24.66.37,1.37.37,2.1Z"/>
      <path fill="none" stroke="#C8102E" strokeMiterlimit="10" strokeWidth="6" d="M60.13,36.78c0,.67-.11,1.34-.31,1.95-.86,2.68-3.47,4.62-6.54,4.62s-5.67-1.95-6.54-4.63c-.2-.61-.3-1.26-.3-1.94,0-.74.13-1.46.37-2.12.92-2.59,3.47-4.45,6.48-4.45s5.57,1.87,6.48,4.47c.24.66.37,1.37.37,2.1Z"/>
    </svg>
  );
}

export default function LoginPage() {
  const { signIn, isAuthenticated } = useShop();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err?.message || 'Sign in failed';
      if (message.includes('Invalid login')) {
        setError('Invalid email or password');
      } else if (message.includes('Email not confirmed')) {
        setError('Please check your email to confirm your account');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Kanupi Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <KanupiLogo className="w-20 h-14" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Kanupi Shop</h1>
          <p className="text-sm text-gray-400 mt-1">Parts intelligence for your shop</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourshop.com"
                autoComplete="email"
                autoFocus
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-300 mt-6">
          Need an account? Contact your Kanupi representative.
        </p>
      </div>
    </div>
  );
}
