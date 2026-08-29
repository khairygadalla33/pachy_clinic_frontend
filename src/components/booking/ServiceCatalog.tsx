import { useState } from 'react';
import { Search, Sparkles, Clock, Check, Plus, ChevronDown, Layers, Tag } from 'lucide-react';
import type { SelectedServiceItem } from './CrossSellSection';

interface ServiceCatalogProps {
  categories: any[];
  services: any[];
  selectedServices: SelectedServiceItem[];
  onToggleService: (service: any, pricing: any) => void;
}

export default function ServiceCatalog({
  categories,
  services,
  selectedServices,
  onToggleService,
}: ServiceCatalogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAreaModalService, setActiveAreaModalService] = useState<any | null>(null);

  // Filter services by category and search query
  const filteredServices = services.filter((service) => {
    const matchesCategory =
      selectedCategoryId === 'ALL' || service.categoryId === selectedCategoryId;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      service.nameAr?.toLowerCase().includes(query) ||
      service.name?.toLowerCase().includes(query) ||
      service.pricings?.some((p: any) => p.bodyArea?.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحثي عن خدمة أو جلسة (ليزر، تقشير، تنظيف...)"
          className="w-full pl-4 pr-11 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs transition-all"
        />
        <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3.5 top-3 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-full px-2.5 py-1"
          >
            مسح
          </button>
        )}
      </div>

      {/* Horizontal Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar -mx-4 px-4">
        <button
          onClick={() => setSelectedCategoryId('ALL')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
            selectedCategoryId === 'ALL'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-sm shadow-purple-200 scale-105'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>كل الخدمات</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedCategoryId === cat.id
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-sm shadow-purple-200 scale-105'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
            }`}
          >
            <span>{cat.nameAr || cat.name}</span>
          </button>
        ))}
      </div>

      {/* Services List with Clearer & Larger Typography */}
      <div className="space-y-3 pt-1">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-700">لا توجد خدمات مطابقة للبحث</p>
            <p className="text-xs text-slate-400 mt-1">جربي البحث بكلمات أخرى أو اختاري تصنيف آخر</p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const pricings = service.pricings || [];
            const hasMultiplePricings = pricings.length > 1;

            // Check how many pricings of this service are selected
            const selectedCountForService = selectedServices.filter(
              (s) => s.serviceId === service.id
            ).length;

            const minPrice = pricings.reduce(
              (min: number, p: any) => Math.min(min, Number(p.price)),
              pricings[0] ? Number(pricings[0].price) : 0
            );

            return (
              <div
                key={service.id}
                onClick={() => {
                  if (hasMultiplePricings) {
                    setActiveAreaModalService(service);
                  } else {
                    onToggleService(service, pricings[0]);
                  }
                }}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer group active:scale-[0.99] select-none ${
                  selectedCountForService > 0
                    ? 'border-purple-400 ring-2 ring-purple-200/70 bg-purple-50/20'
                    : 'border-slate-200/90 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-50 to-purple-50 text-purple-700 border border-purple-100">
                        {service.category?.nameAr || 'خدمة'}
                      </span>
                      {service.duration && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-purple-500" />
                          <span>{service.duration} دقيقة</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-purple-700 transition-colors">
                      {service.nameAr || service.name}
                    </h3>

                    {service.description && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    )}

                    {/* Price and Options Row (Strictly unbroken lines) */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-3">
                      {hasMultiplePricings ? (
                        <>
                          <div className="inline-flex items-baseline gap-1 whitespace-nowrap">
                            <span className="text-xs font-semibold text-slate-500">تبدأ من</span>
                            <span className="text-lg sm:text-xl font-black text-rose-600 font-mono">{minPrice}</span>
                            <span className="text-xs font-bold text-slate-700">ج.م</span>
                          </div>
                          <span className="inline-flex items-center text-[11px] font-bold text-purple-700 bg-purple-100/90 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            {pricings.length} خيارات ومناطق
                          </span>
                        </>
                      ) : (
                        <div className="inline-flex items-baseline gap-1 whitespace-nowrap">
                          <span className="text-lg sm:text-xl font-black text-rose-600 font-mono">{minPrice}</span>
                          <span className="text-xs font-bold text-slate-700">ج.م</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 pt-1">
                    {hasMultiplePricings ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAreaModalService(service);
                        }}
                        className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          selectedCountForService > 0
                            ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                            : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>
                          {selectedCountForService > 0
                            ? `مختار (${selectedCountForService})`
                            : 'تحديد المنطقة'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleService(service, pricings[0]);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          selectedCountForService > 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-rose-50 to-purple-50 hover:from-rose-500 hover:to-purple-600 text-purple-700 hover:text-white border border-purple-200'
                        }`}
                      >
                        {selectedCountForService > 0 ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>تم الاختيار</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>حجز الخدمة</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Multiple Pricing / Body Area Selection Bottom-Sheet Modal */}
      {activeAreaModalService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 px-5 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
              <div>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  اختيار المنطقة أو الباقة
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {activeAreaModalService.nameAr || activeAreaModalService.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveAreaModalService(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* List of pricing options */}
            <div className="p-4 space-y-2.5 overflow-y-auto max-h-[60vh]">
              {activeAreaModalService.pricings?.map((pricing: any) => {
                const isSelected = selectedServices.some(
                  (s) =>
                    s.serviceId === activeAreaModalService.id && s.pricingId === pricing.id
                );
                const price = Number(pricing.price);

                return (
                  <div
                    key={pricing.id}
                    onClick={() => onToggleService(activeAreaModalService, pricing)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-300/80 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {pricing.bodyArea || 'جلسة عادية'}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {activeAreaModalService.duration ? `${activeAreaModalService.duration} دقيقة` : 'جلسة مخصصة'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left" dir="ltr">
                      <span className="text-base font-black text-rose-600">{price}</span>
                      <span className="text-xs font-bold text-slate-700 ml-1">EGP</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-600">
                المختار: {selectedServices.filter((s) => s.serviceId === activeAreaModalService.id).length} خيارات
              </span>
              <button
                onClick={() => setActiveAreaModalService(null)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-200 transition-all"
              >
                تأكيد ومتابعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
