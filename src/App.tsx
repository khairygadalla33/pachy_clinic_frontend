import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import Services from './pages/Services';
import Appointments from './pages/Appointments';
import ReceptionDashboard from './pages/ReceptionDashboard';
import DoctorWorkstation from './pages/DoctorWorkstation';
import Invoices from './pages/Invoices';
import Treasury from './pages/Treasury';
import Packages from './pages/Packages';
import Inventory from './pages/Inventory';
import Devices from './pages/Devices';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import LaserSessions from './pages/LaserSessions';
import InjectionSessions from './pages/InjectionSessions';
import SkinCareSessions from './pages/SkinCareSessions';
import WhatsApp from './pages/WhatsApp';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-rose-500">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="services" element={<Services />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="reception" element={<ReceptionDashboard />} />
        <Route path="doctor-workstation" element={<DoctorWorkstation />} />
        
        {/* Phase 3: Clients */}
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientProfile />} />

        {/* Sessions */}
        <Route path="laser-sessions" element={<LaserSessions />} />
        <Route path="injection-sessions" element={<InjectionSessions />} />
        <Route path="skincare-sessions" element={<SkinCareSessions />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        
        {/* Phase 7 & 8 */}
        <Route path="invoices" element={<Invoices />} />
        <Route path="treasury" element={<Treasury />} />
        <Route path="packages" element={<Packages />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="devices" element={<Devices />} />
        
        {/* Phase 9 & 10 */}
        <Route path="reports" element={<Reports />} />
        <Route path="audit-logs" element={<AuditLog />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-center" />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
