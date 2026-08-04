import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Calendar, Clock, User, CheckCircle, Plus, Minus, CreditCard, Banknote, Trash2, Smartphone, Wallet } from 'lucide-react';
import api from '../../lib/api';
import ClientAutocomplete from '../ClientAutocomplete';
import Modal from '../Modal';

interface AppointmentPOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWalkIn?: boolean;
  branchId?: string;
  initialDate?: Date;
  initialTime?: string;
}

export default function AppointmentPOSModal({ 
  isOpen, 
  onClose, 
  isWalkIn = false,
  branchId,
  initialDate,
  initialTime
}: AppointmentPOSModalProps) {
  const queryClient = useQueryClient();
  
  // -- State --
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    clientId: '',
    staffId: '',
    scheduledDate: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: initialTime || '10:00',
    depositAmount: '',
    depositMethod: 'CASH',
    discountValue: '',
    discountType: 'value' as 'value' | 'percentage',
    notes: '',
    source: isWalkIn ? 'walkin' : 'phone',
  });

  // Basket State: Array of objects { service, quantity, unitPrice, total }
  const [basket, setBasket] = useState<any[]>([]);
  const [pricingModalService, setPricingModalService] = useState<any | null>(null);

  // Handle Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Update formData when props change
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        scheduledDate: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: initialTime || '10:00',
        source: isWalkIn ? 'walkin' : 'phone',
      }));
    } else {
      // Reset on close
      setBasket([]);
      setPricingModalService(null);
      setFormData({
        clientId: '',
        staffId: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        depositAmount: '',
        depositMethod: 'CASH',
        discountValue: '',
        discountType: 'value',
        notes: '',
        source: 'phone',
      });
      setActiveCategory('ALL');
      setSearchQuery('');
    }
  }, [isOpen, initialDate, initialTime, isWalkIn]);

  // -- Queries --
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => api.get('/services').then(r => r.data),
    enabled: isOpen
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff', 'doctors'],
    queryFn: () => api.get('/users/doctors').then(r => r.data),
    enabled: isOpen
  });

  // -- Computed --
  const services = servicesData || [];
  
  const categories = useMemo(() => {
    const cats = new Map<string, { id: string, name: string, nameAr: string }>();
    services.forEach((s: any) => {
      if (s.category) {
        cats.set(s.category.id, s.category);
      }
    });
    return Array.from(cats.values());
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s: any) => {
      if (s.isActive === false) return false;
      const matchCat = activeCategory === 'ALL' || s.categoryId === activeCategory;
      const matchSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.nameAr || '').includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [services, activeCategory, searchQuery]);

  // Totals
  const subTotal = basket.reduce((sum, item) => sum + (item.total || 0), 0);
  
  let discountAmount = 0;
  const discountVal = Number(formData.discountValue) || 0;
  if (formData.discountType === 'percentage') {
    discountAmount = subTotal * (discountVal / 100);
  } else {
    discountAmount = discountVal;
  }
  
  const netAccount = Math.max(0, subTotal - discountAmount);
  const deposit = Number(formData.depositAmount) || 0;
  const remaining = Math.max(0, netAccount - deposit);

  // -- Mutations --
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint = isWalkIn ? '/appointments/walk-in' : '/appointments';
      return api.post(endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      toast.success(isWalkIn ? 'تم تسجيل الزيارة المباشرة بنجاح' : 'تم حجز الموعد بنجاح');
      onClose();
    },
    onError: (err: any) => {
      toast.error('خطأ في إنشاء الموعد: ' + (err.response?.data?.message || err.message));
    },
  });

  const getPricingBadge = (model: string) => {
    switch (model) {
      case 'PER_AREA': return <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">بالمنطقة</span>;
      case 'PER_PULSE': return <span className="bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded text-[10px] font-bold">بالنبضات</span>;
      case 'HYBRID': return <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">هجين</span>;
      case 'PACKAGE': return <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">باقة</span>;
      default: return null;
    }
  };

  // -- Handlers --
  const handleAddToBasket = (service: any, pricing?: any) => {
    const pricingId = pricing?.id;
    // Check if already exists by serviceId + pricingId
    const exists = basket.find(item => item.service.id === service.id && item.pricingId === pricingId);
    if (exists) {
      toast.error('الخدمة مضافة بالفعل');
      return;
    }
    
    const price = Number(pricing?.price || service.pricings?.[0]?.price || 0);
    setBasket([...basket, { 
      service, 
      pricingId,
      pricingName: pricing?.bodyArea || pricing?.nameAr || pricing?.name,
      unitPrice: price, 
      quantity: 1, 
      total: price 
    }]);

    if (pricingModalService) {
      setPricingModalService(null);
    }
  };

  const handleRemoveFromBasket = (index: number) => {
    setBasket(basket.filter((_, i) => i !== index));
  };

  const handleUpdatePrice = (index: number, newPrice: number) => {
    setBasket(basket.map((item, i) => {
      if (i === index) {
        return { ...item, unitPrice: newPrice, total: newPrice * item.quantity };
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast.error('الرجاء اختيار العميل');
      return;
    }
    if (!formData.staffId) {
      toast.error('الرجاء اختيار الطبيب');
      return;
    }
    if (basket.length === 0) {
      toast.error('الرجاء اختيار خدمة واحدة على الأقل');
      return;
    }

    const payload: any = {
      clientId: formData.clientId,
      staffId: formData.staffId,
      branchId,
      notes: formData.notes,
      source: formData.source,
      serviceIds: basket.map(item => item.service.id),
      pricingIds: basket.map(item => item.pricingId || null),
      unitPrices: basket.map(item => {
        if (discountAmount > 0 && subTotal > 0) {
          const itemDiscount = discountAmount * (item.unitPrice / subTotal);
          return item.unitPrice - itemDiscount;
        }
        return item.unitPrice;
      }),
    };

    if (formData.depositAmount && Number(formData.depositAmount) > 0) {
      payload.depositAmount = Number(formData.depositAmount);
      payload.depositMethod = formData.depositMethod;
    }

    if (!isWalkIn) {
      payload.scheduledDate = new Date(formData.scheduledDate).toISOString();
      payload.startTime = formData.startTime;
    }

    createMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm p-4">
      <div className="bg-surface-50 w-full max-w-[1200px] h-[88vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-surface-200">
        
        {/* ======================= RIGHT PANE: SERVICES MENU (65%) ======================= */}
        <div className="w-full md:w-[65%] bg-surface-50 flex flex-col h-full min-h-0 border-l border-surface-200 order-1">
          
          {/* Header & Search */}
          <div className="p-5 border-b border-surface-200 bg-white shrink-0">
            <h1 className="text-xl font-black text-surface-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </span>
              {isWalkIn ? 'زيارة مباشرة (Walk-in)' : 'تفاصيل الحجز'}
            </h1>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="ابحث عن خدمة بالاسم..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            </div>
          </div>

          {/* Categories Tabs */}
          <div className="border-b border-surface-200 dark:border-surface-700 overflow-x-auto shrink-0 bg-white">
            <nav className="-mb-px flex space-x-8 space-x-reverse whitespace-nowrap px-5">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`relative whitespace-nowrap py-4 px-1 font-medium text-sm transition-colors ${
                  activeCategory === 'ALL'
                    ? 'text-[#6b4c9a]'
                    : 'text-surface-500 hover:text-surface-700 hover:border-b hover:border-surface-300'
                }`}
              >
                الكل
                {activeCategory === 'ALL' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6b4c9a]" />
                )}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative whitespace-nowrap py-4 px-1 font-medium text-sm transition-colors ${
                    activeCategory === cat.id
                      ? 'text-[#6b4c9a]'
                      : 'text-surface-500 hover:text-surface-700 hover:border-b hover:border-surface-300'
                  }`}
                >
                  {cat.nameAr || cat.name}
                  {activeCategory === cat.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6b4c9a]" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Services Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 p-5 custom-scrollbar">
            {isLoadingServices ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-surface-400 space-y-3">
                <Search className="w-12 h-12 opacity-20" />
                <p className="font-medium text-lg">لا توجد خدمات مطابقة للبحث</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                {filteredServices.map((service: any) => {
                  const hasMultiplePricings = service.pricings && service.pricings.length > 1;
                  const price = Number(service.pricings?.[0]?.price || 0);
                  const inBasket = !hasMultiplePricings && basket.some(b => b.service.id === service.id);
                  
                  return (
                    <div 
                      key={service.id} 
                      onClick={() => {
                        if (hasMultiplePricings) {
                          setPricingModalService(service);
                        } else if (!inBasket) {
                          handleAddToBasket(service);
                        }
                      }}
                      className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer relative overflow-hidden group ${
                        inBasket 
                          ? 'border-[#6b4c9a] ring-4 ring-[#6b4c9a]/10 shadow-md bg-[#6b4c9a]/5' 
                          : 'border-surface-100 hover:border-[#6b4c9a] hover:shadow-lg hover:-translate-y-1'
                      }`}
                    >
                      {inBasket && (
                        <div className="absolute top-0 right-0 bg-[#6b4c9a] text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
                          مضافة
                        </div>
                      )}
                      <div className="flex flex-col h-full gap-3">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-[#6b4c9a] uppercase tracking-wider mb-1">
                            {service.category?.nameAr || service.category?.name}
                          </p>
                          <h3 className="font-bold text-surface-900 text-sm leading-tight line-clamp-2">
                            {service.nameAr || service.name}
                          </h3>
                        </div>
                        <div className="flex items-end justify-between mt-auto pt-2 border-t border-surface-50">
                          <div className="flex items-baseline gap-1 text-[#6b4c9a]">
                            {hasMultiplePricings ? (
                              <span className="text-xs font-bold text-surface-500">متعدد الأسعار</span>
                            ) : (
                              <>
                                <span className="text-lg font-black">{price.toLocaleString()}</span>
                                <span className="text-xs font-bold">ج.م</span>
                              </>
                            )}
                          </div>
                          {!inBasket && (
                            hasMultiplePricings ? (
                              <button className="text-[10px] font-bold text-white bg-[#6b4c9a] hover:bg-[#5a3f85] px-3 py-1.5 rounded-lg transition-colors">
                                حدد اختيارك
                              </button>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-surface-500 group-hover:bg-[#6b4c9a] group-hover:text-white transition-colors">
                                <Plus className="w-5 h-5" />
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ======================= LEFT PANE: BASKET & DETAILS (35%) ======================= */}
        <div className="w-full md:w-[35%] bg-white flex flex-col h-full min-h-0 z-10 shadow-xl order-2">


          {/* Fixed Meta: Client & Doctor */}
          <div className="p-4 border-b border-surface-200 bg-white grid grid-cols-2 gap-3 shrink-0">
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary-500" /> العميل <span className="text-red-500">*</span>
              </label>
              <div className="relative z-50">
                <ClientAutocomplete onSelect={(client) => setFormData({ ...formData, clientId: client.id })} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-500" /> الطبيب المعالج <span className="text-red-500">*</span>
              </label>
              <select 
                className="input-field text-sm font-medium bg-surface-50 border-surface-200"
                required
                value={formData.staffId}
                onChange={e => setFormData({ ...formData, staffId: e.target.value })}
              >
                <option value="">اختر الطبيب...</option>
                {staffData?.map((s: any) => (
                  <option key={s.id} value={s.id}>د. {s.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable Basket Area */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 custom-scrollbar bg-surface-50/30">
            
            {/* --- Date & Time (Only for future bookings) --- */}
            {!isWalkIn && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" /> التاريخ
                  </label>
                  <input 
                    type="date"
                    className="input-field text-sm font-medium"
                    required
                    value={formData.scheduledDate}
                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> الوقت
                  </label>
                  <input 
                    type="time"
                    className="input-field text-sm font-medium"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* --- Basket Items --- */}
            <div>
              <h3 className="text-sm font-bold text-surface-800 mb-3 flex items-center justify-between border-b border-surface-100 pb-2">
                <span>الخدمات المضافة ({basket.length})</span>
                <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded text-xs">{subTotal.toLocaleString()} ج.م</span>
              </h3>
              
              {basket.length === 0 ? (
                <div className="text-center py-8 bg-surface-50 rounded-xl border border-dashed border-surface-200">
                  <span className="text-surface-400 text-sm">لم يتم إضافة خدمات. اختر من القائمة الجانبية.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {basket.map((item, idx) => (
                    <div key={idx} className="group flex items-center justify-between bg-white border border-surface-200 p-3 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-bold text-surface-900 truncate">
                          {item.service.nameAr || item.service.name}
                          {item.pricingName && <span className="text-primary-600 mr-1 text-xs">({item.pricingName})</span>}
                        </p>
                        <p className="text-xs text-surface-500">{item.service.category?.nameAr}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Price Input */}
                        <div className="relative">
                          <input 
                            type="number" 
                            className="w-24 text-sm font-bold text-center border-surface-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 py-1.5"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdatePrice(idx, Number(e.target.value))}
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-surface-400 font-medium">ج.م</span>
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => handleRemoveFromBasket(idx)}
                          className="p-1.5 text-surface-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer (Totals & Submit) */}
          <div className="p-4 border-t border-surface-200 bg-white shrink-0">
            <div className="space-y-3 mb-4 text-sm font-medium text-surface-600">
              {/* 1. Subtotal */}
              <div className="flex justify-between items-center text-surface-600">
                <span>الإجمالي (Total):</span>
                <span className="font-bold">{subTotal.toLocaleString()} ج.م</span>
              </div>

              {/* 2. Discount */}
              <div className="flex items-center justify-between text-surface-600">
                <span>الخصم (Discount):</span>
                <div className="flex items-center gap-1">
                  <select 
                    className="input-field py-1 pl-6 pr-2 w-28 h-8 text-sm"
                    value={formData.discountType}
                    onChange={(e: any) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="value">قيمة</option>
                    <option value="percentage">% نسبة</option>
                  </select>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    className="input-field py-1 px-2 w-20 text-center h-8 text-sm"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  />
                </div>
              </div>
              
              {/* 3. Account / Net Total */}
              <div className="flex justify-between items-center text-primary-700 font-bold border-t border-surface-100 pt-2">
                <span>الحساب (Net):</span>
                <span>{netAccount.toLocaleString()} ج.م</span>
              </div>

              {/* 4. Paid / Deposit (Merged) */}
              <div className="flex items-center justify-between text-emerald-600 pb-2 border-b border-surface-100">
                <span>المدفوع (Paid):</span>
                <div className="flex items-center gap-1">
                  <select 
                    className="input-field py-1 pl-6 pr-2 w-28 h-8 text-sm"
                    value={formData.depositMethod}
                    onChange={(e: any) => setFormData({ ...formData, depositMethod: e.target.value })}
                  >
                    <option value="CASH">نقدي</option>
                    <option value="CARD">بطاقة</option>
                    <option value="INSTAPAY">إنستاباي</option>
                    <option value="E_WALLET">محفظة</option>
                  </select>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    className="input-field py-1 px-2 w-20 text-center h-8 text-sm font-bold text-emerald-700"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                  />
                </div>
              </div>

              {/* 5. Remaining */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-red-600 font-bold text-base">المتبقي (Remaining):</span>
                <span className="text-red-600 font-black text-xl">{remaining.toLocaleString()} ج.م</span>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl font-bold transition-colors shrink-0"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending || !formData.clientId || !formData.staffId || basket.length === 0}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 text-base font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                {createMutation.isPending ? 'جاري التنفيذ...' : (isWalkIn ? 'تسجيل كزيارة مباشرة' : 'تأكيد وحجز الموعد')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Selection Modal */}
      {pricingModalService && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4"
          onClick={() => setPricingModalService(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-surface-200 flex items-center justify-between bg-surface-50">
              <h2 className="text-lg font-bold text-surface-900">
                حدد اختيارك لـ {pricingModalService.nameAr || pricingModalService.name}
              </h2>
              <button onClick={() => setPricingModalService(null)} className="text-surface-400 hover:text-surface-600 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {pricingModalService.pricings?.map((pricing: any) => {
                const inBasket = basket.some(b => b.service.id === pricingModalService.id && b.pricingId === pricing.id);
                return (
                  <div 
                    key={pricing.id}
                    onClick={() => {
                      if (!inBasket) handleAddToBasket(pricingModalService, pricing);
                    }}
                    className={`flex items-center gap-2 p-3 border-b border-surface-100 last:border-0 rounded-lg mb-1 cursor-pointer transition-colors ${inBasket ? 'bg-primary-50/50' : 'hover:bg-surface-50'}`}
                  >
                    <p className="font-bold text-surface-900 text-sm flex-1 text-start truncate" title={pricing.bodyArea || pricing.nameAr || pricing.name || 'أساسي'}>
                      {pricing.bodyArea || pricing.nameAr || pricing.name || 'أساسي'}
                    </p>
                    
                    <div className="flex-1 flex justify-center shrink-0">
                      {getPricingBadge(pricing.pricingModel)}
                    </div>
                    
                    <div className="flex-1 flex justify-end items-center gap-3">
                      <p className="text-primary-600 font-bold text-sm whitespace-nowrap">
                        {pricing.pricingModel === 'PER_PULSE' 
                          ? `${Number(pricing.pricePerPulse || 0).toLocaleString()} ج.م/نبضة` 
                          : `${Number(pricing.price).toLocaleString()} ج.م`}
                      </p>
                      {inBasket ? (
                        <span className="text-[10px] font-bold text-primary-600 bg-primary-100 px-2 py-1 rounded-md shrink-0">مضافة</span>
                      ) : (
                        <button 
                          onClick={() => handleAddToBasket(pricingModalService, pricing)}
                          className="w-7 h-7 rounded-full shrink-0 bg-surface-100 hover:bg-primary-500 hover:text-white flex items-center justify-center text-surface-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
