import { useState, useEffect } from 'react';
import Card from '../Card';
import { Search, Phone, MapPin, Receipt, Activity, User } from 'lucide-react';
import Badge from '../Badge';

import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function WhatsAppChatwootTab() {
  const [phoneSearch, setPhoneSearch] = useState('');
  const debouncedSearch = useDebounce(phoneSearch, 500);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['client-360', debouncedSearch],
    queryFn: () => api.get(`/whatsapp/client-360/${debouncedSearch}`).then(r => r.data),
    enabled: debouncedSearch.length >= 8
  });

  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-6 h-[800px]">
      {/* Left Side: Chatwoot Iframe */}
      <Card className="p-0 overflow-hidden flex flex-col">
        <div className="bg-surface-50 p-3 border-b border-surface-200 flex justify-between items-center">
          <h3 className="font-bold text-surface-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            منصة خدمة العملاء (Chatwoot)
          </h3>
          <button className="text-xs btn-secondary py-1">فتح في نافذة جديدة</button>
        </div>
        <div className="flex-1 bg-surface-100 flex items-center justify-center">
          {/* Iframe placeholder */}
          <div className="text-center text-surface-500">
            <p className="mb-2">جاري تحميل صندوق الوارد...</p>
            <p className="text-xs">Chatwoot URL is not configured yet.</p>
          </div>
        </div>
      </Card>

      {/* Right Side: Customer 360 */}
      <Card className="flex flex-col">
        <h3 className="font-bold text-surface-800 mb-4 pb-2 border-b">ملف العميل الشامل (Customer 360)</h3>
        
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="ابحث برقم الهاتف أو الاسم..." 
            value={phoneSearch}
            onChange={e => setPhoneSearch(e.target.value)}
            className="input-field w-full pl-10"
          />
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-surface-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : customer ? (
          <div className="space-y-6 flex-1 overflow-auto pr-2">
            {/* Basic Info */}
            <div className="bg-surface-50 p-4 rounded-xl border border-surface-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-surface-800">{customer.name}</h4>
                  <Badge variant="success">نشط</Badge>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-surface-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span dir="ltr">{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{customer.city}</span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-surface-200 text-center shadow-sm">
                <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-surface-500">مؤشر التفاعل</p>
                <p className="font-bold text-surface-800">{customer.healthScore}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-surface-200 text-center shadow-sm">
                <Receipt className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <p className="text-xs text-surface-500">الرصيد المستحق</p>
                <p className="font-bold text-surface-800">{customer.totalBalance}</p>
              </div>
            </div>

            {/* Recent Invoices */}
            <div>
              <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> الفواتير الأخيرة
              </h4>
              <div className="space-y-2">
                {customer.recentInvoices?.map((inv: any) => (
                  <div key={inv.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-surface-200 shadow-sm text-sm">
                    <div>
                      <p className="font-bold text-surface-800">{inv.id}</p>
                      <p className="text-xs text-surface-500">{inv.date}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{inv.amount}</p>
                      <span className={`text-xs ${inv.status === 'مدفوع' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : debouncedSearch.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-surface-400 text-center">
            <User className="w-12 h-12 mb-3 opacity-20" />
            <p>لم يتم العثور على مريض بهذا الرقم</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-surface-400 text-center">
            <Search className="w-12 h-12 mb-3 opacity-20" />
            <p>ابحث برقم العميل لربطه بالمحادثة الحالية</p>
          </div>
        )}
      </Card>
    </div>
  );
}
