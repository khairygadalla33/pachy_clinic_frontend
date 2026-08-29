import { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  CalendarCheck,
  ShoppingBag,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import axios from 'axios';
import ServiceCatalog from '../components/booking/ServiceCatalog';
import CrossSellSection from '../components/booking/CrossSellSection';
import type { SelectedServiceItem } from '../components/booking/CrossSellSection';
import BookingWizardModal from '../components/booking/BookingWizardModal';
import DebouraBrowserTab from '../components/booking/DebouraBrowserTab';

export default function PublicBookingApp() {
  // Navigation Tab: 'PACHY' | 'DEBOURA'
  const [activeTab, setActiveTab] = useState<'PACHY' | 'DEBOURA'>('PACHY');

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
        // Fallback default sample data if backend connection fails
        setCatalog({
          branches: [
            { id: 'b1', name: 'فرع الدقي - الرئيسي', address: 'ميدان المساحة، الدقي', isDefault: true },
            { id: 'b2', name: 'فرع التجمع الخامس', address: 'شارع التسعين الشمالي', isDefault: false },
          ],
          categories: [
            { id: 'c1', name: 'LASER_HAIR_REMOVAL', nameAr: 'ازالة الشعر بالليزر', type: 'LASER_HAIR_REMOVAL', sortOrder: 1 },
            { id: 'c2', name: 'SKIN_CARE', nameAr: 'العناية بالبشرة والتقشير', type: 'SKIN_CARE', sortOrder: 2 },
            { id: 'c3', name: 'INJECTIONS', nameAr: 'الحقن التجميلي', type: 'INJECTIONS', sortOrder: 3 },
          ],
          doctors: [
            { id: 'd1', fullName: 'د. يمنى خالد', specialization: 'أخصائية جلدية وتجميل' },
            { id: 'd2', fullName: 'د. مريم أحمد', specialization: 'أخصائية الليزر والعناية بالبشرة' },
          ],
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
    <div className="min-h-screen bg-slate-200/70 flex justify-center font-cairo dir-rtl">
      {/* Mobile-First Container */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl flex flex-col relative overflow-x-hidden">
        
        {/* ===================== TAB 1: PACHY CLINIC ===================== */}
        {activeTab === 'PACHY' && (
          <div className="flex-1 pb-32">
            {/* Top Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-rose-100/80 px-4 py-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-rose-200">
                    🌸
                  </div>
                  <div>
                    <h1 className="text-base font-black text-slate-900 leading-none">
                      باتشي كلينك
                    </h1>
                    <p className="text-[11px] text-rose-600 font-bold mt-0.5">
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
                      className="text-xs font-bold py-1.5 pl-3 pr-7 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 focus:outline-none appearance-none cursor-pointer"
                    >
                      {catalog.branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <MapPin className="w-3.5 h-3.5 text-rose-500 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Hero Welcome Banner */}
            <div className="p-4 pt-3">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white shadow-lg shadow-rose-200 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-rose-100 mb-2">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    <span>حجز موعد أونلاين فوري</span>
                  </span>
                  <h2 className="text-lg font-black leading-snug">
                    تألقي بأحدث خدمات الليزر والعناية بالبشرة
                  </h2>
                  <p className="text-xs text-rose-100 mt-1 font-medium leading-relaxed">
                    اختاري خدماتكِ المفضلة ونسقي موعدكِ المناسب في ثوانٍ معدودة.
                  </p>
                </div>

                {/* Decorative background shapes */}
                <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute right-0 -top-8 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="px-4">
              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">جاري تحميل قائمة الخدمات...</p>
                </div>
              ) : (
                <>
                  {/* Services Catalog with Category Pills & Search */}
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
                <div className="p-3.5 px-4 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-2xl flex items-center justify-between border border-slate-700">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs text-slate-300 font-medium">
                        تم اختيار {selectedServices.length} خدمات
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-black text-rose-400">{totalPrice}</span>
                      <span className="text-xs font-bold text-slate-300">ج.م</span>
                      <span className="text-[10px] text-slate-400 mr-2 flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {totalDuration} دقيقة
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowWizard(true)}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-500/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>متابعة الحجز</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: DEBOURA COSMETICS ===================== */}
        {activeTab === 'DEBOURA' && <DebouraBrowserTab />}

        {/* ===================== PERMANENT 2-TAB BOTTOM NAVIGATION BAR ===================== */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl py-2 px-3 flex items-center justify-around">
          {/* Tab 1: Pachy Clinic */}
          <button
            type="button"
            onClick={() => setActiveTab('PACHY')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all ${
              activeTab === 'PACHY'
                ? 'text-rose-600 font-black scale-105'
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'PACHY'
                  ? 'bg-rose-50 text-rose-600 shadow-xs'
                  : 'bg-transparent text-slate-400'
              }`}
            >
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-1">باتشي كلينك</span>
          </button>

          {/* Tab 2: Deboura Cosmetics */}
          <button
            type="button"
            onClick={() => setActiveTab('DEBOURA')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all ${
              activeTab === 'DEBOURA'
                ? 'text-rose-600 font-black scale-105'
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'DEBOURA'
                  ? 'bg-rose-50 text-rose-600 shadow-xs'
                  : 'bg-transparent text-slate-400'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-1">ديبورا كوزموتكس</span>
          </button>
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
