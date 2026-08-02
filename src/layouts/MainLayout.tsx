import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex dir-rtl">
      <Sidebar />
      {/* mr-0 on mobile, mr-[72px] on tablet (md-lg), mr-[260px] on desktop (lg+) for RTL */}
      <div className="flex-1 flex flex-col mr-0 md:mr-[72px] lg:mr-[260px] transition-[margin] duration-300 min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-5 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
