import { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  CalendarCheck,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import axios from 'axios';
import ServiceCatalog from '../components/booking/ServiceCatalog';
import CrossSellSection from '../components/booking/CrossSellSection';
import type { SelectedServiceItem } from '../components/booking/CrossSellSection';
import BookingWizardModal from '../components/booking/BookingWizardModal';

export default function PublicBookingApp() {
  // Catalog Data from Backend
  const [catalog, setCatalog] = useState<{
    branches: any[];
    categories: any[];
    doctors: any[];
    settings: any;
  }>({
    branches: [],
    categories: [],
    doctors: [],
    settings: null,
  });
  const [loading, setLoading] = useState(true);

  // Selected Branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Cart / Selected Services
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);

  // Wizard Modal
  const [showWizard, setShowWizard] = useState(false);

  // Fetch Catalog
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://clinic.deboura.com/api';
    setLoading(true);

    axios
      .get(`${API_URL}/public-booking/catalog`)
      .then((res) => {
        setCatalog(res.data);
        if (res.data.branches?.length > 0) {
          const defaultBranch = res.data.branches.find((b: any) => b.isDefault) || res.data.branches[0];
          setSelectedBranchId(defaultBranch.id);
        }
      })
      .catch((err) => {
        console.error('Failed to load public booking catalog, using fallback', err);
        setCatalog({
          branches: [
            { id: 'b1', name: 'الفرع الرئيسي', address: 'القاهرة', isDefault: true },
          ],
          categories: [
            { id: 'c1', name: 'LASER_HAIR_REMOVAL', nameAr: 'ازالة الشعر بالليزر', type: 'LASER_HAIR_REMOVAL', sortOrder: 1 },
            { id: 'c2', name: 'SKIN_CARE', nameAr: 'العناية بالبشرة والتقشير', type: 'SKIN_CARE', sortOrder: 2 },
            { id: 'c3', name: 'INJECTIONS', nameAr: 'الحقن التجميلي', type: 'INJECTIONS', sortOrder: 3 },
          ],
          doctors: [],
          settings: {
            clinicName: 'باتشي كلينك',
            whatsappNumber: '201000000000',
          },
        });
        setSelectedBranchId('b1');
      })
      .finally(() => setLoading(false));
  }, []);

  // Flatten all services across categories
  const allServices = catalog.categories.flatMap((cat) =>
    (cat.services || []).map((s: any) => ({
      ...s,
      category: cat,
    }))
  );

  // Toggle Service Selection
  const handleToggleService = (service: any, pricing: any) => {
    const existingIndex = selectedServices.findIndex(
      (s) => s.serviceId === service.id && s.pricingId === pricing?.id
    );

    if (existingIndex > -1) {
      // Remove
      setSelectedServices((prev) => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      // Add
      const newItem: SelectedServiceItem = {
        serviceId: service.id,
        serviceName: service.name,
        serviceNameAr: service.nameAr,
        pricingId: pricing?.id,
        bodyArea: pricing?.bodyArea,
        price: pricing ? Number(pricing.price) : 0,
        duration: service.duration || 30,
        categoryType: service.category?.type,
      };
      setSelectedServices((prev) => [...prev, newItem]);
    }
  };

  // Remove Service
  const handleRemoveService = (serviceId: string, pricingId?: string) => {
    setSelectedServices((prev) =>
      prev.filter((s) => !(s.serviceId === serviceId && (pricingId ? s.pricingId === pricingId : true)))
    );
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0);

  return (
    <div className="min-h-screen bg-slate-200/80 flex justify-center font-cairo dir-rtl">
      {/* Mobile-First Container */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-x-hidden">
        
        {/* Main Pachy Clinic Experience */}
        <div className="flex-1 pb-28 bg-slate-50/60">
          {/* Top Sticky Header with Official PACHY Logo */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100 px-4 py-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/pachy-logo.png"
                  alt="Pachy Clinic"
                  className="h-11 w-11 object-contain drop-shadow-sm hover:scale-105 transition-transform"
                />
                <div>
                  <h1 className="text-lg font-black text-slate-900 leading-none">
                    باتشي كلينك
                  </h1>
                  <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-l from-rose-500 to-purple-600 mt-1">
                    Pachy Beauty & Laser Clinic
                  </p>
                </div>
              </div>

              {/* Branch Switcher Pill */}
              {catalog.branches?.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="text-xs font-bold py-1.5 pl-3 pr-7 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    {catalog.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-3.5 h-3.5 text-purple-500 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {/* Soft, Elegant Top Hero Card */}
          <div className="p-4 pt-3">
            <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50/90 via-purple-50/80 to-pink-50/90 border border-purple-100/90 shadow-xs relative overflow-hidden">
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-purple-100 text-xs font-bold text-purple-700 mb-2 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>حجز موعد أونلاين سريع</span>
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                  تألقي بأحدث خدمات الليزر والعناية بالبشرة ✨
                </h2>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  اختاري خدماتكِ ونسقي موعدكِ المناسب في خطوات سهلة وسريعة.
                </p>
              </div>

              {/* Gentle background glow */}
              <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-rose-200/30 rounded-full blur-xl pointer-events-none" />
              <div className="absolute right-0 -top-8 w-28 h-28 bg-purple-200/30 rounded-full blur-xl pointer-events-none" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="px-4">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-600">جاري تحميل قائمة الخدمات والأسعار...</p>
              </div>
            ) : (
              <>
                {/* Services Catalog */}
                <ServiceCatalog
                  categories={catalog.categories}
                  services={allServices}
                  selectedServices={selectedServices}
                  onToggleService={handleToggleService}
                />

                {/* Smart Cross-Selling Section */}
                <CrossSellSection
                  selectedServices={selectedServices}
                  allServices={allServices}
                  onToggleService={handleToggleService}
                />
              </>
            )}
          </div>

          {/* Floating Bottom Cart Bar */}
          {selectedServices.length > 0 && (
            <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-30 animate-in slide-in-from-bottom duration-300">
              <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-2xl flex items-center justify-between border border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs text-slate-300 font-bold">
                      تم اختيار {selectedServices.length} خدمات
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-rose-400">{totalPrice}</span>
                    <span className="text-xs font-bold text-slate-300">ج.م</span>
                    <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      {totalDuration} دقيقة
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWizard(true)}
                  className="py-3 px-5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-purple-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <span>متابعة الحجز</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================== PERMANENT 2-TAB BOTTOM NAVIGATION BAR ===================== */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl py-2 px-3 flex items-center justify-around">
          {/* Tab 1: Pachy Clinic */}
          <div className="flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl text-purple-600 font-black scale-105 select-none">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-rose-50 to-purple-50 text-purple-600 shadow-2xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">باتشي كلينك</span>
          </div>

          {/* Tab 2: Deboura Cosmetics (Direct Link to Store with Cosmetics Icon) */}
          <a
            href="https://deboura.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all text-slate-500 hover:text-purple-600 font-bold group active:scale-95 select-none"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-transparent text-slate-400 group-hover:text-purple-600 group-hover:bg-gradient-to-r group-hover:from-rose-50 group-hover:to-purple-50">
              <CosmeticsIcon className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">ديبورا كوزموتكس</span>
          </a>
        </div>

        {/* Multi-Step Booking Wizard Modal */}
        <BookingWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          selectedServices={selectedServices}
          onRemoveService={handleRemoveService}
          onClearServices={() => setSelectedServices([])}
          branches={catalog.branches}
          doctors={catalog.doctors}
          selectedBranchId={selectedBranchId}
          setSelectedBranchId={setSelectedBranchId}
        />
      </div>
    </div>
  );
}

function CosmeticsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || "w-5 h-5"}
    >
      {/* Luxury Cosmetics & Perfume Silhouette */}
      <path d="M10 2h4a1 1 0 0 1 1 1v4H9V3a1 1 0 0 1 1-1z" />
      <path d="M9 7h6v3H9z" />
      <rect x="7" y="10" width="10" height="12" rx="2" />
      <path d="M12 14v4" />
      <path d="M20 5.5l1-1" />
      <circle cx="19.5" cy="9.5" r="0.75" fill="currentColor" />
      <circle cx="4.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  );
}
