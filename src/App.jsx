import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { CurrencyProvider } from './CurrencyContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Content from './pages/Content';
import Payments from './pages/Payments';
import Withdrawals from './pages/Withdrawals';
import Levels from './pages/Levels';
import TokenPackages from './pages/TokenPackages';
import Profile from './pages/Profile';

function Protected() {
  const { isAuthenticated, refreshing } = useAuth();
  if (refreshing) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="content" element={<Content />} />
        <Route path="payments" element={<Payments />} />
        <Route path="withdrawals" element={<Withdrawals />} />
        <Route path="levels" element={<Levels />} />
        <Route path="token-packages" element={<TokenPackages />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CurrencyProvider>
    </AuthProvider>
  );
}
