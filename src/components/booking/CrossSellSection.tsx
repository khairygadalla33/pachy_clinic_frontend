import { Sparkles, Plus, Check } from 'lucide-react';

export interface SelectedServiceItem {
  serviceId: string;
  serviceName: string;
  serviceNameAr?: string;
  pricingId?: string;
  bodyArea?: string;
  price: number;
  duration?: number;
  categoryType?: string;
}

interface CrossSellSectionProps {
  selectedServices: SelectedServiceItem[];
  allServices: any[];
  onToggleService: (service: any, pricing: any) => void;
}

export default function CrossSellSection({
  selectedServices,
  allServices,
  onToggleService,
}: CrossSellSectionProps) {
  if (selectedServices.length === 0) return null;

  // Selected service IDs
  const selectedIds = new Set(selectedServices.map((s) => s.serviceId));

  // Determine complementary suggestions based on selected categories
  const hasLaser = selectedServices.some((s) => s.categoryType === 'LASER_HAIR_REMOVAL');
  const hasSkinCare = selectedServices.some((s) => s.categoryType === 'SKIN_CARE');

  // Filter available candidate services not yet selected
  let candidates = allServices.filter((s) => !selectedIds.has(s.id));

  // Prioritize suggestions
  if (hasLaser && !hasSkinCare) {
    candidates.sort((a, b) => (b.category?.type === 'SKIN_CARE' ? 1 : 0) - (a.category?.type === 'SKIN_CARE' ? 1 : 0));
  }

  // Take top 4 recommendations
  const suggestions = candidates.slice(0, 4);

  if (suggestions.length === 0) return null;

  return (
    <div className="my-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-50/90 via-purple-50/80 to-pink-50/90 border border-purple-200/80 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">خدمات مكملة مقترحة لكِ ✨</h3>
          <p className="text-xs text-purple-700 font-semibold">أضيفي لمسة نضارة إضافية لتكتمل جلستكِ اليوم</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((service) => {
          const defaultPricing = service.pricings?.[0];
          const price = defaultPricing ? Number(defaultPricing.price) : 0;
          const isSelected = selectedServices.some(
            (s) => s.serviceId === service.id && s.pricingId === defaultPricing?.id
          );

          return (
            <div
              key={service.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-white border-purple-400 shadow-xs ring-2 ring-purple-300/80'
                  : 'bg-white/95 hover:bg-white border-purple-100 hover:border-purple-300 shadow-2xs'
              }`}
            >
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {service.category?.nameAr || 'عرض'}
                  </span>
                  {defaultPricing?.bodyArea && (
                    <span className="text-xs text-slate-500 truncate">
                      ({defaultPricing.bodyArea})
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                  {service.nameAr || service.name}
                </h4>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-sm sm:text-base font-black text-rose-600">{price}</span>
                  <span className="text-xs font-bold text-slate-600">ج.م</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleService(service, defaultPricing)}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-gradient-to-r hover:from-rose-500 hover:to-purple-600 hover:text-white border border-purple-200'
                }`}
                title={isSelected ? 'تمت الإضافة' : 'إضافة للحجز'}
              >
                {isSelected ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
