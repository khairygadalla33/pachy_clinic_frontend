import { useAuth } from '../lib/auth';
import { LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-rose-100 h-16 flex items-center justify-between px-6 shrink-0 no-print">
      <div className="text-xl font-bold text-rose-600">باتشي كلينك</div>
      <div className="flex items-center gap-4">
        <span className="text-gray-600">{user?.fullName}</span>
        <button
          onClick={logout}
          className="text-gray-500 hover:text-red-600 transition-colors"
          title="تسجيل الخروج"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
