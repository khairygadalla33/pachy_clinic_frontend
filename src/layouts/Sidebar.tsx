import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { 
  LayoutDashboard, Users, Calendar, Settings as SettingsIcon,
  Activity, Syringe, Sparkles, Receipt, Wallet,
  Package, Box, Stethoscope, BarChart3, ShieldAlert,
  MessageSquare, ChevronRight, ChevronLeft, LogOut, X, HeartPulse
} from 'lucide-react';
import InstallPWA from '../components/InstallPWA';

const navGroups = [
  {
    title: 'نظرة عامة',
    items: [
      { path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'TECHNICIAN', 'RECEPTIONIST'] },
    ]
  },
  {
    title: 'العمليات',
    items: [
      { path: '/reception', label: 'الاستقبال', icon: LayoutDashboard, roles: ['ADMIN', 'RECEPTIONIST'] },
      { path: '/clients', label: 'العملاء', icon: Users, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
      { path: '/appointments', label: 'المواعيد', icon: Calendar, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'TECHNICIAN'] },
      { path: '/doctor-workstation', label: 'عيادة الطبيب', icon: Stethoscope, roles: ['ADMIN', 'DOCTOR'] },
    ]
  },
  {
    title: 'التسويق',
    items: [
      { path: '/whatsapp', label: 'الواتساب', icon: MessageSquare, roles: ['ADMIN', 'RECEPTIONIST'] },
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
      { path: '/settings', label: 'الإعدادات', icon: SettingsIcon, roles: ['ADMIN'] },
    ]
  },
  {
    title: 'التقارير والسجلات',
    items: [
      { 
        path: '/reports-group', 
        label: 'التقارير', 
        icon: BarChart3, 
        roles: ['ADMIN', 'DOCTOR', 'NURSE', 'TECHNICIAN'],
        subItems: [
          { path: '/reports', label: 'التقارير المالية', roles: ['ADMIN'] },
          { path: '/laser-sessions', label: 'جلسات الليزر', roles: ['ADMIN', 'DOCTOR', 'TECHNICIAN'] },
          { path: '/injection-sessions', label: 'جلسات الحقن', roles: ['ADMIN', 'DOCTOR'] },
          { path: '/skincare-sessions', label: 'العناية بالبشرة', roles: ['ADMIN', 'NURSE', 'TECHNICIAN'] },
          { path: '/audit-logs', label: 'سجل العمليات', roles: ['ADMIN'] },
        ]
      }
    ]
  }
];

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-600',
  DOCTOR: 'bg-rose-600',
  NURSE: 'bg-purple-600',
  TECHNICIAN: 'bg-teal-600',
  RECEPTIONIST: 'bg-blue-600',
};

// Hook to detect tablet size
function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const checkSize = () => setIsTablet(window.innerWidth < 1024 && window.innerWidth >= 768);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  return isTablet;
}

// utility function to combine class names
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const { user, logout } = useAuth();
  const location = useLocation();
  const isTablet = useIsTablet();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    }
  });

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Listen for mobile menu toggle events from Header
  useEffect(() => {
    const handler = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-sidebar', handler);
    return () => window.removeEventListener('toggle-mobile-sidebar', handler);
  }, []);

  const sidebarContent = (isMobile: boolean) => (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-rose-600 overflow-hidden flex items-center justify-center text-white">
          {settings?.logoUrl ? (
             <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
             <HeartPulse className="w-5 h-5" />
          )}
        </div>
        <AnimatePresence>
          {(isMobile || !collapsed) && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap flex-1">
              <h1 className="text-white font-bold text-base tracking-tight truncate max-w-[160px]">
                {settings?.clinicNameAr || settings?.clinicName || 'Pachy Clinic'}
              </h1>
              <p className="text-surface-400 text-[10px] font-medium truncate max-w-[160px]">
                Management System
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-surface-400 hover:text-white mr-auto">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-print px-3 py-4 custom-scrollbar">
        {navGroups.map((group, index) => {
          const visibleItems = group.items.filter(item => 
            !user || !item.roles || item.roles.includes(user.role as string)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={index} className="mb-6">
              {(!collapsed || isMobile) && (
                <h3 className="px-3 text-[11px] font-semibold text-surface-400 uppercase tracking-wider mb-2 transition-opacity duration-200">
                  {group.title}
                </h3>
              )}
              {collapsed && !isMobile && (
                 <div className="h-px bg-white/10 w-8 mx-auto my-3" />
              )}
              
              <nav className="space-y-1">
                {visibleItems.map((item: any) => {
                  const isActive = item.subItems
                    ? item.subItems.some((s: any) => location.pathname.startsWith(s.path))
                    : location.pathname.startsWith(item.path);

                  const isDropdownOpen = openDropdowns[item.path] || isActive;

                  if (item.subItems) {
                    const visibleSubItems = item.subItems.filter((sub: any) => 
                      !user || !sub.roles || sub.roles.includes(user.role as string)
                    );
                    if (visibleSubItems.length === 0) return null;

                    return (
                      <div key={item.path} className="flex flex-col mb-1">
                        <button
                          onClick={() => setOpenDropdowns(prev => ({ ...prev, [item.path]: !prev[item.path] }))}
                          title={(!isMobile && collapsed) ? item.label : undefined}
                          className={cn(
                            'sidebar-link w-full text-right flex items-center justify-between',
                            isActive && 'active',
                            (!isMobile && collapsed) && 'justify-center px-0'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-rose-400')} />
                            <AnimatePresence>
                              {(isMobile || !collapsed) && (
                                <motion.span 
                                  initial={{ opacity: 0, width: 0 }} 
                                  animate={{ opacity: 1, width: 'auto' }} 
                                  exit={{ opacity: 0, width: 0 }} 
                                  className="overflow-hidden whitespace-nowrap"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          {(isMobile || !collapsed) && (
                            <ChevronLeft className={cn("w-4 h-4 flex-shrink-0 transition-transform opacity-60", isDropdownOpen && "-rotate-90")} />
                          )}
                        </button>

                        <AnimatePresence>
                          {isDropdownOpen && (isMobile || !collapsed) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pr-9 mt-1 space-y-1"
                            >
                              {visibleSubItems.map((sub: any) => {
                                const isSubActive = location.pathname.startsWith(sub.path);
                                return (
                                  <NavLink
                                    key={sub.path}
                                    to={sub.path}
                                    className={cn(
                                      'block py-2 px-3 text-[13px] rounded-lg transition-colors font-medium',
                                      isSubActive 
                                        ? 'bg-rose-500/10 text-rose-500' 
                                        : 'text-surface-400 hover:text-white hover:bg-white/5'
                                    )}
                                  >
                                    {sub.label}
                                  </NavLink>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={(!isMobile && collapsed) ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'sidebar-link',
                          isActive && 'active',
                          (!isMobile && collapsed) && 'justify-center px-0'
                        )
                      }
                    >
                      <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-rose-400')} />
                      <AnimatePresence>
                        {(isMobile || !collapsed) && (
                          <motion.span 
                            initial={{ opacity: 0, width: 0 }} 
                            animate={{ opacity: 1, width: 'auto' }} 
                            exit={{ opacity: 0, width: 0 }} 
                            className="overflow-hidden whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          );
        })}
        <div className="mt-8 px-2">
           <InstallPWA />
        </div>
      </div>

      <div className="px-3 py-3 border-t border-white/10 space-y-2 shrink-0">
        {(isMobile || !collapsed) && user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-2 py-2">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', roleColors[user.role] || 'bg-rose-600')}>
              {user.fullName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user.fullName}</p>
              {!isTablet && <p className="text-[11px] text-surface-400 truncate">{user.role}</p>}
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-white/10 text-surface-400 hover:text-white transition-colors mr-auto" title="تسجيل الخروج">
              <LogOut className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {!isMobile && collapsed && user && (
          <button onClick={logout} className="w-full flex justify-center py-2 text-surface-400 hover:text-white transition-colors" title="تسجيل الخروج">
            <LogOut className="w-4 h-4" />
          </button>
        )}
        
        {/* Collapse toggle - only on desktop (lg+) */}
        {!isMobile && (
          <button onClick={() => setCollapsed(c => !c)} className="w-full flex items-center justify-center py-2 rounded-lg text-surface-400 hover:text-white hover:bg-white/10 transition-colors hidden lg:flex">
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* ─── Desktop/Tablet Sidebar ─── */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed right-0 top-0 bottom-0 z-40 bg-surface-900 dark:bg-surface-950 shadow-sidebar flex-col hidden md:flex max-lg:!w-[72px]"
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Sidebar Panel */}
            <motion.aside
              initial={{ x: 280 }}
              animate={{ x: 0 }}
              exit={{ x: 280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] z-50 bg-surface-900 dark:bg-surface-950 shadow-2xl flex flex-col md:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
