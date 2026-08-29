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

  // Take top 3 recommendations
  const suggestions = candidates.slice(0, 4);

  if (suggestions.length === 0) return null;

  return (
    <div className="my-6 p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50/80 border border-rose-200/80 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">خدمات مكملة مقترحة لكِ</h3>
          <p className="text-[11px] text-rose-600 font-medium">أضيفي خدمة إضافية لتكتمل تجربتكِ اليوم</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {suggestions.map((service) => {
          const defaultPricing = service.pricings?.[0];
          const price = defaultPricing ? Number(defaultPricing.price) : 0;
          const isSelected = selectedServices.some(
            (s) => s.serviceId === service.id && s.pricingId === defaultPricing?.id
          );

          return (
            <div
              key={service.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-white border-rose-400 shadow-sm ring-1 ring-rose-300'
                  : 'bg-white/90 hover:bg-white border-rose-100 hover:border-rose-300 shadow-xs'
              }`}
            >
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                    {service.category?.nameAr || 'عرض'}
                  </span>
                  {defaultPricing?.bodyArea && (
                    <span className="text-[10px] text-slate-500 truncate">
                      ({defaultPricing.bodyArea})
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">
                  {service.nameAr || service.name}
                </h4>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-bold text-rose-600">{price}</span>
                  <span className="text-[10px] text-slate-400">ج.م</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleService(service, defaultPricing)}
                className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'
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
