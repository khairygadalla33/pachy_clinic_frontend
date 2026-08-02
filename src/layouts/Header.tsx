import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Bell, Menu, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

const pageNames: Record<string, string> = {
  '/dashboard': 'لوحة التحكم',
  '/reception': 'الاستقبال',
  '/clients': 'العملاء',
  '/appointments': 'المواعيد',
  '/doctor-workstation': 'عيادة الطبيب',
  '/laser-sessions': 'جلسات الليزر',
  '/injection-sessions': 'جلسات الحقن',
  '/skincare-sessions': 'العناية بالبشرة',
  '/whatsapp': 'الواتساب',
  '/invoices': 'الفواتير',
  '/treasury': 'الخزينة',
  '/packages': 'الباقات',
  '/inventory': 'المخزون',
  '/devices': 'الأجهزة',
  '/services': 'الخدمات',
  '/users': 'المستخدمين',
  '/settings': 'الإعدادات',
  '/reports': 'التقارير',
  '/audit-logs': 'سجل العمليات',
};

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  
  // Basic dark mode toggle state (can be extracted to a context later if needed)
  const [dark, setDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDark(isDark);
  };

  const pageName = pageNames[location.pathname] || pageNames[`/${location.pathname.split('/')[1]}`] || 'باتشي كلينك';

  return (
    <header className="h-14 md:h-16 border-b border-surface-200 dark:border-surface-700/50 bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-3">
        {/* Hamburger menu - mobile only */}
        <button
          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 md:hidden"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base md:text-lg font-semibold text-surface-900 dark:text-surface-100 truncate">{pageName}</h2>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
        <button className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
        </button>
        
        <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 transition-colors">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="flex items-center gap-2 mr-1 md:mr-2 pr-2 md:pr-3 border-r border-surface-200 dark:border-surface-700">
          <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-right">
            <div className="hidden md:block text-right px-2">
              <div className="text-sm font-medium text-surface-900 dark:text-surface-100">
                {user?.fullName}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
