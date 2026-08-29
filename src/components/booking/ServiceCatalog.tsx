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
          className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs transition-all"
        />
        <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full px-2 py-0.5"
          >
            مسح
          </button>
        )}
      </div>

      {/* Horizontal Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar -mx-4 px-4">
        <button
          onClick={() => setSelectedCategoryId('ALL')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            selectedCategoryId === 'ALL'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 scale-105'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>كل الخدمات</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedCategoryId === cat.id
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 scale-105'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-300'
            }`}
          >
            <span>{cat.nameAr || cat.name}</span>
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="space-y-3 pt-1">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">لا توجد خدمات مطابقة للبحث</p>
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
                className={`bg-white rounded-2xl p-4 border transition-all duration-200 shadow-xs hover:shadow-md ${
                  selectedCountForService > 0
                    ? 'border-rose-400 ring-1 ring-rose-200'
                    : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                        {service.category?.nameAr || 'خدمة'}
                      </span>
                      {service.duration && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{service.duration} دقيقة</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 leading-snug">
                      {service.nameAr || service.name}
                    </h3>

                    {service.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    <div className="flex items-baseline gap-1 mt-2.5">
                      {hasMultiplePricings ? (
                        <>
                          <span className="text-xs text-slate-400">تبدأ من</span>
                          <span className="text-base font-black text-rose-600">{minPrice}</span>
                          <span className="text-xs font-bold text-slate-600">ج.م</span>
                          <span className="text-[10px] text-slate-400 mr-1">
                            ({pricings.length} خيارات/مناطق)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-base font-black text-rose-600">{minPrice}</span>
                          <span className="text-xs font-bold text-slate-600">ج.م</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 pt-1">
                    {hasMultiplePricings ? (
                      <button
                        type="button"
                        onClick={() => setActiveAreaModalService(service)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          selectedCountForService > 0
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>
                          {selectedCountForService > 0
                            ? `مختار (${selectedCountForService})`
                            : 'تحديد المنطقة'}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleService(service, pricings[0])}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          selectedCountForService > 0
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                        }`}
                      >
                        {selectedCountForService > 0 ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>تم الاختيار</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  اختيار المنطقة أو الباقة
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  {activeAreaModalService.nameAr || activeAreaModalService.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveAreaModalService(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* List of pricing options */}
            <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
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
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {pricing.bodyArea || 'جلسة عادية'}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {activeAreaModalService.duration ? `${activeAreaModalService.duration} دقيقة` : 'جلسة مخصصة'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left" dir="ltr">
                      <span className="text-sm font-black text-rose-600">{price}</span>
                      <span className="text-xs font-bold text-slate-600 ml-1">EGP</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                المختار: {selectedServices.filter((s) => s.serviceId === activeAreaModalService.id).length} خيارات
              </span>
              <button
                onClick={() => setActiveAreaModalService(null)}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all"
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
