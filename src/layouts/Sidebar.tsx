import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Settings as SettingsIcon,
  Activity, Syringe, Sparkles, Receipt, Wallet,
  Package, Box, UsersRound, Stethoscope, BarChart3, ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../lib/auth';

import InstallPWA from '../components/InstallPWA';

const navGroups = [
  {
    title: 'نظرة عامة',
    items: [
      { path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'TECHNICIAN', 'RECEPTIONIST'] },
      { path: '/reports', label: 'التقارير', icon: BarChart3, roles: ['ADMIN'] },
      { path: '/audit-logs', label: 'سجل العمليات', icon: ShieldAlert, roles: ['ADMIN'] },
    ]
  },
  {
    title: 'العمليات',
    items: [
      { path: '/reception', label: 'الاستقبال', icon: LayoutDashboard, roles: ['ADMIN', 'RECEPTIONIST'] },
      { path: '/clients', label: 'العملاء', icon: Users, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
      { path: '/appointments', label: 'المواعيد', icon: Calendar, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'TECHNICIAN'] },
      { path: '/doctor-workstation', label: 'عيادة الطبيب', icon: Stethoscope, roles: ['ADMIN', 'DOCTOR'] },
      { path: '/laser-sessions', label: 'جلسات الليزر', icon: Activity, roles: ['ADMIN', 'DOCTOR', 'TECHNICIAN'] },
      { path: '/injection-sessions', label: 'جلسات الحقن', icon: Syringe, roles: ['ADMIN', 'DOCTOR'] },
      { path: '/skincare-sessions', label: 'العناية بالبشرة', icon: Sparkles, roles: ['ADMIN', 'NURSE', 'TECHNICIAN'] },
      { path: '/whatsapp', label: 'الواتساب (WhatsApp)', icon: MessageSquare, roles: ['ADMIN', 'RECEPTIONIST'] },
    ]
  },
  {
    title: 'المالية',
    items: [
      { path: '/invoices', label: 'الفواتير', icon: Receipt, roles: ['ADMIN', 'RECEPTIONIST'] },
      { path: '/treasury', label: 'الخزينة', icon: Wallet, roles: ['ADMIN'] },
      { path: '/packages', label: 'الباقات', icon: Package, roles: ['ADMIN', 'RECEPTIONIST'] },
    ]
  },
  {
    title: 'الأصول والخدمات',
    items: [
      { path: '/inventory', label: 'المخزون', icon: Box, roles: ['ADMIN'] },
      { path: '/devices', label: 'الأجهزة', icon: Box, roles: ['ADMIN'] },
      { path: '/services', label: 'الخدمات', icon: Sparkles, roles: ['ADMIN'] },
    ]
  },
  {
    title: 'النظام',
    items: [
      { path: '/users', label: 'المستخدمين', icon: UsersRound, roles: ['ADMIN'] },
      { path: '/settings', label: 'الإعدادات', icon: SettingsIcon, roles: ['ADMIN'] },
    ]
  }
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-white border-l border-rose-100 h-full flex flex-col shrink-0 overflow-y-auto no-print">
      <div className="p-4 flex-1">
        {navGroups.map((group, index) => {
          const visibleItems = group.items.filter(item => 
            !user || !item.roles || item.roles.includes(user.role as string)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={index} className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <nav className="space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-rose-50 text-rose-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-rose-500'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          );
        })}
      </div>
      <InstallPWA />
    </aside>
  );
}
