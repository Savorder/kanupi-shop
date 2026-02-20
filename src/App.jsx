/**
 * App.jsx — Root component for Kanupi Shop Dashboard
 * 
 * Routes:
 *   /           → DashboardHome (three-panel: VIN/Part/Marcus)
 *   /results    → ResultsPage (Kayak-style parts list with margins)
 *   /orders     → OrderHistory (searchable order table)
 *   /settings   → Settings (shop profile, margin rules, brand prefs)
 *   /login      → LoginPage (auth gate)
 * 
 * Auth gate: All routes except /login require authentication.
 * If not authenticated, redirects to /login.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useShop } from './context/ShopContext';
import ShopHeader from './components/ShopHeader';
import LoginPage from './components/LoginPage';
import DashboardHome from './components/DashboardHome';
import ResultsPage from './components/ResultsPage';
import OrderHistory from './components/OrderHistory';
import PreferencesPage from './components/PreferencesPage';
import SettingsPage from './components/SettingsPage';

function AuthGate({ children }) {
  const { isAuthenticated, isLoading } = useShop();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <AuthGate>
            <div className="min-h-screen bg-gray-50">
              <ShopHeader />
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/preferences" element={<PreferencesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </AuthGate>
        }
      />
    </Routes>
  );
}
