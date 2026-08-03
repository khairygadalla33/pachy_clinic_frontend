import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Zap, 
  Syringe, 
  Sparkles, 
  Camera, 
  X, 
  Calendar, 
  Check, 
  Calculator, 
  Package,
  Cpu,
  AlertCircle,
  Cloud,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import api from '../lib/api';

// Map ServiceCategoryType to session form type
function resolveSessionType(categoryType?: string): 'LASER' | 'INJECTION' | 'SKIN_CARE' {
  if (!categoryType) return 'SKIN_CARE';
  const ct = categoryType.toUpperCase();
  if (ct.includes('LASER') || ct.includes('CRYO') || ct.includes('CAVITATION')) return 'LASER';
  if (ct.includes('INJECT') || ct.includes('FILLER') || ct.includes('BOTOX')) return 'INJECTION';
  return 'SKIN_CARE';
}

interface SessionFormProps {
  /** The service category type from ServiceCategory.type or derived from category name */
  categoryType?: string;
  appointmentId: string;
  clientId: string;
  serviceId?: string;
  serviceName?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onSaveStatusChange?: (status: 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR') => void;
}

export default function SessionForm({
  categoryType,
  appointmentId,
  clientId,
  serviceId,
  serviceName,
  onSuccess,
  onCancel,
  onSaveStatusChange,
}: SessionFormProps) {
  const queryClient = useQueryClient();
  const sessionType = resolveSessionType(categoryType);

  // Auto-Save state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');

  useEffect(() => {
    if (onSaveStatusChange) {
      onSaveStatusChange(saveStatus);
    }
  }, [saveStatus, onSaveStatusChange]);

  // Form state
  const [formData, setFormData] = useState<any>({
    sessionNumber: 1,
    totalPlanned: 6,
    skinReaction: 'NONE',
    quantityUnit: 'ml',
    anesthesiaUsed: false,
  });

  // Photos state and previews
  const [photos, setPhotos] = useState<{ before?: File; during?: File; after?: File }>({});
  const [photoPreviews, setPhotoPreviews] = useState<{ before?: string; during?: string; after?: string }>({});

  // Fetch Service Details (for pricings)
  const { data: service } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => api.get(`/services/${serviceId}`).then((r) => r.data),
    enabled: !!serviceId,
  });

  // Fetch Active Devices (for Laser machines)
  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.get('/devices').then((r) => r.data),
    enabled: sessionType === 'LASER',
  });
  const devices = Array.isArray(devicesData) ? devicesData : (devicesData?.data || []);

  // Fetch Inventory Products (for filler/botox/serums)
  const { data: products } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => api.get('/inventory/products?limit=100').then((r) => r.data?.data || r.data || []),
    enabled: sessionType === 'INJECTION',
  });

  // Automatically select first pricing if available for laser
  useEffect(() => {
    if (sessionType === 'LASER' && service?.pricings?.length > 0 && !formData.pricingId) {
      const firstPricing = service.pricings[0];
      setFormData((prev: any) => ({
        ...prev,
        pricingId: firstPricing.id,
        bodyArea: firstPricing.bodyArea || prev.bodyArea || '',
      }));
    }
  }, [service, sessionType]);

  // Calculate Laser Cost dynamically
  let calculatedCost = 0;
  let pricingDetails: any = null;
  if (sessionType === 'LASER' && service && formData.pricingId) {
    pricingDetails = service.pricings?.find((p: any) => p.id === formData.pricingId);
    if (pricingDetails) {
      if (pricingDetails.pricingModel === 'PER_AREA') {
        calculatedCost = Number(pricingDetails.price || 0);
      } else if (pricingDetails.pricingModel === 'PER_PULSE') {
        calculatedCost = (Number(formData.numberOfPulses) || 0) * Number(pricingDetails.pricePerPulse || 0);
      } else if (pricingDetails.pricingModel === 'HYBRID') {
        calculatedCost = Number(pricingDetails.price || 0) + ((Number(formData.numberOfPulses) || 0) * Number(pricingDetails.pricePerPulse || 0));
      }
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      let endpoint = '';
      if (sessionType === 'LASER') endpoint = '/sessions/laser';
      else if (sessionType === 'INJECTION') endpoint = '/sessions/injection';
      else endpoint = '/sessions/skin-care';

      const payload = {
        appointmentId,
        clientId,
        ...data,
      };

      let res;
      if (sessionId) {
        // Update existing session
        res = await api.put(`${endpoint}/${sessionId}`, payload);
      } else {
        // Create new session
        res = await api.post(endpoint, payload);
      }
      
      const newSessionId = res.data.id;
      if (!sessionId) {
        setSessionId(newSessionId);
      }

      const typeStr = sessionType === 'LASER' ? 'laser' : sessionType === 'INJECTION' ? 'injection' : 'skin-care';

      // Upload photos if selected (and we have an ID)
      if (photos.before) {
        const fd = new FormData();
        fd.append('file', photos.before);
        await api.post(`/sessions/${typeStr}/${newSessionId}/photos/photoBeforeUrl`, fd);
      }
      if (photos.during) {
        const fd = new FormData();
        fd.append('file', photos.during);
        await api.post(`/sessions/${typeStr}/${newSessionId}/photos/photoDuringUrl`, fd);
      }
      if (photos.after) {
        const fd = new FormData();
        fd.append('file', photos.after);
        await api.post(`/sessions/${typeStr}/${newSessionId}/photos/photoAfterUrl`, fd);
      }

      return res.data;
    },
    onSuccess: () => {
      setSaveStatus('SAVED');
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      queryClient.invalidateQueries({ queryKey: ['patientHistory'] });
      queryClient.invalidateQueries({ queryKey: ['laserSessions'] });
      queryClient.invalidateQueries({ queryKey: ['injectionSessions'] });
      queryClient.invalidateQueries({ queryKey: ['skinCareSessions'] });
    },
    onError: (err: any) => {
      setSaveStatus('ERROR');
      toast.error('خطأ في حفظ الجلسة: ' + (err.response?.data?.message || err.message));
    },
  });

  // Auto-Save Effect
  useEffect(() => {
    // Only auto-save if required fields are present depending on type
    let isValid = false;
    if (sessionType === 'LASER' && formData.pricingId && formData.bodyArea) isValid = true;
    if (sessionType === 'INJECTION' && formData.productUsed && formData.areaInjected) isValid = true;
    if (sessionType === 'SKIN_CARE' && formData.procedureName) isValid = true;

    if (!isValid) return;

    const timer = setTimeout(() => {
      setSaveStatus('SAVING');
      saveMutation.mutate(formData);
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData, sessionType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Manual submit is no longer required, handled by auto-save
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, prefix: 'before' | 'during' | 'after') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotos((prev) => ({ ...prev, [prefix]: file }));
      setPhotoPreviews((prev) => ({ ...prev, [prefix]: URL.createObjectURL(file) }));
    }
  };

  const removePhoto = (prefix: 'before' | 'during' | 'after') => {
    setPhotos((prev) => {
      const copy = { ...prev };
      delete copy[prefix];
      return copy;
    });
    setPhotoPreviews((prev) => {
      const copy = { ...prev };
      delete copy[prefix];
      return copy;
    });
  };

  // Injection area presets
  const injectionAreas = ['شفايف (Lips)', 'خدود (Cheeks)', 'جبهة (Forehead)', 'حول العين (Crow\'s feet)', 'خطوط الابتسامة (Nasolabial)', 'ذقن وتحديد فك (Jawline/Chin)', 'رقبة (Neck)', 'أخرى'];

  // Skin care procedure presets
  const skinCareProcedures = ['هيدرافيشل (HydraFacial)', 'تنظيف بشرة عميق (Deep Cleansing)', 'تقشير كيميائي (Chemical Peel)', 'تقشير كربوني (Carbon Peel)', 'ديرمابن (Dermapen)', 'ميزوثيرابي (Mesotherapy)', 'بلازما نضارة (PRP)', 'جلسة نضارة وترطيب (Glow Session)'];

  return (
    <div className="relative space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">

      {/* ======================= LASER FORM ======================= */}
      {sessionType === 'LASER' && (
        <div className="space-y-5 bg-white p-5 rounded-xl border border-primary-300 shadow-sm">
          <div className="flex items-center pb-3 border-b border-surface-100">
            <h4 className="font-bold text-surface-900 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-red-500" />
              بيانات جلسة الليزر والبارامترات الطبية
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pricing / Area selection */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                المنطقة ونموذج التسعير <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field text-sm"
                required
                value={formData.pricingId || ''}
                onChange={(e) => {
                  const pricing = service?.pricings?.find((p: any) => p.id === e.target.value);
                  setFormData({
                    ...formData,
                    pricingId: e.target.value,
                    bodyArea: pricing?.bodyArea || formData.bodyArea || '',
                  });
                }}
              >
                <option value="">اختر المنطقة / التسعير...</option>
                {service?.pricings?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.bodyArea} ({p.pricingModel === 'PER_AREA' ? 'سعر ثابت للمنطقة' : p.pricingModel === 'PER_PULSE' ? 'بالنبضة' : p.pricingModel === 'HYBRID' ? 'هجين' : 'باقة'}) - {p.price || p.pricePerPulse} ج.م
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Area Name */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                اسم المنطقة المعالجة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="مثال: الوجه كامل، البكيني، الساقين..."
                required
                value={formData.bodyArea || ''}
                onChange={(e) => setFormData({ ...formData, bodyArea: e.target.value })}
              />
            </div>
          </div>

          {/* Device and Pulses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-primary-600" />
                الجهاز المستخدم
              </label>
              <select
                className="input-field text-sm"
                value={formData.deviceId || ''}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              >
                <option value="">اختر جهاز الليزر...</option>
                {devices?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.model ? `(${d.model})` : ''} - نبضات سابقة: {d.totalPulseCount?.toLocaleString() || 0}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                عدد النبضات المستهلكة (Pulses)
              </label>
              <input
                type="number"
                min="0"
                className="input-field text-sm"
                placeholder="مثال: 450"
                value={formData.numberOfPulses || ''}
                onChange={(e) => setFormData({ ...formData, numberOfPulses: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Clinical Parameters: Energy, Spot size, Pulse width, Cooling */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-50 p-3.5 rounded-lg border border-surface-200">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">الطاقة Energy (J/cm²)</label>
              <input
                type="number"
                step="0.1"
                placeholder="مثال: 14.5"
                className="input-field text-sm"
                value={formData.energyLevel || ''}
                onChange={(e) => setFormData({ ...formData, energyLevel: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">حجم البقعة Spot Size (mm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="مثال: 18"
                className="input-field text-sm"
                value={formData.spotSize || ''}
                onChange={(e) => setFormData({ ...formData, spotSize: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">عرض النبضة Pulse Width (ms)</label>
              <input
                type="number"
                step="0.1"
                placeholder="مثال: 3"
                className="input-field text-sm"
                value={formData.pulseWidth || ''}
                onChange={(e) => setFormData({ ...formData, pulseWidth: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">طريقة التبريد Cooling</label>
              <select
                className="input-field text-sm"
                value={formData.coolingMethod || ''}
                onChange={(e) => setFormData({ ...formData, coolingMethod: e.target.value })}
              >
                <option value="تبريد هوائي دائم (Cryo/Air)">تبريد هوائي دائم (Cryo/Air)</option>
                <option value="تبريد تلامسي ياقوتي (Contact/Sapphire)">تبريد تلامسي (Contact)</option>
                <option value="تبريد غاز DCD Dynamic">تبريد غاز DCD</option>
                <option value="جل تبريد موضعي">جل تبريد موضعي</option>
                <option value="بدون تبريد">بدون تبريد</option>
              </select>
            </div>
          </div>

          {/* Session Numbers and Skin Reaction */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">رقم الجلسة الحالية</label>
              <input
                type="number"
                min="1"
                required
                className="input-field text-sm"
                value={formData.sessionNumber || 1}
                onChange={(e) => setFormData({ ...formData, sessionNumber: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">إجمالي الجلسات المخططة</label>
              <input
                type="number"
                min="1"
                className="input-field text-sm"
                value={formData.totalPlanned || 6}
                onChange={(e) => setFormData({ ...formData, totalPlanned: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">رد فعل الجلد (Skin Reaction)</label>
              <select
                className="input-field text-sm"
                value={formData.skinReaction || 'NONE'}
                onChange={(e) => setFormData({ ...formData, skinReaction: e.target.value })}
              >
                <option value="NONE">طبيعي بدون احمرار (None)</option>
                <option value="MILD">احمرار بسيط متوقع (Mild)</option>
                <option value="MODERATE">احمرار متوسط (Moderate)</option>
                <option value="SEVERE">احمرار شديد / تفاعل (Severe)</option>
              </select>
            </div>
          </div>

          {/* Next Session Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary-600" />
                موعد الجلسة القادمة المقترح
              </label>
              <input
                type="date"
                className="input-field text-sm"
                value={formData.nextSessionDate || ''}
                onChange={(e) => setFormData({ ...formData, nextSessionDate: e.target.value })}
              />
            </div>

            {/* Calculated Cost Card */}
            <div className="p-3.5 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-xs text-red-700 font-bold block flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" /> التكلفة المحسوبة للجلسة:
                </span>
                <span className="text-[11px] text-surface-600">
                  {pricingDetails ? `${pricingDetails.pricingModel}` : 'حسب التسعير المحدد'}
                </span>
              </div>
              <span className="text-lg font-black text-red-900">
                {calculatedCost.toFixed(2)} ج.م
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================= INJECTION FORM ======================= */}
      {sessionType === 'INJECTION' && (
        <div className="space-y-5 bg-white p-5 rounded-xl border border-primary-300 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <h4 className="font-bold text-surface-900 flex items-center gap-2 text-sm">
              <Syringe className="w-4 h-4 text-teal-600" />
              تفاصيل جلسة الحقن والمواد المستخدمة
            </h4>
            <span className="text-xs text-surface-500">الفيلر، البوتوكس، الميزوثيرابي، الخيوط</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inventory Product / Product Used */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-teal-600" />
                المنتج المستخدم <span className="text-red-500">*</span>
              </label>
              <div className="space-y-1.5">
                <select
                  className="input-field text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      const prod = products?.find((p: any) => p.id === e.target.value);
                      setFormData({
                        ...formData,
                        productId: prod?.id,
                        productUsed: prod?.name || e.target.value,
                        quantityUnit: prod?.unit || formData.quantityUnit || 'ml',
                      });
                    }
                  }}
                >
                  <option value="">اختيار من مخزون العيادة...</option>
                  {products?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (المتاح: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  required
                  placeholder="أو اكتب اسم المنتج يدوياً (مثال: Juvederm Ultra 3, Botox Allergan)..."
                  className="input-field text-sm"
                  value={formData.productUsed || ''}
                  onChange={(e) => setFormData({ ...formData, productUsed: e.target.value })}
                />
              </div>
            </div>

            {/* Product Batch */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                رقم التشغيلة / الباتش (Lot / Batch Number)
              </label>
              <input
                type="text"
                placeholder="مثال: LOT-2024-X98"
                className="input-field text-sm"
                value={formData.productBatch || ''}
                onChange={(e) => setFormData({ ...formData, productBatch: e.target.value })}
              />
              <span className="text-[11px] text-surface-400 mt-1 block">مهم لتتبع جودة المنتج وسلامة المريض</span>
            </div>
          </div>

          {/* Area Injected with Quick Chips */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1.5">
              منطقة الحقن المعالجة <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {injectionAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => {
                    const current = formData.areaInjected || '';
                    const updated = current ? `${current} + ${area}` : area;
                    setFormData({ ...formData, areaInjected: updated });
                  }}
                  className="text-xs bg-white text-surface-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 px-3 py-1.5 rounded-full border border-surface-200 transition-colors shadow-sm font-medium"
                >
                  + {area}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              placeholder="مثال: الشفايف العلوية والسفلية، خطوط الابتسامة..."
              className="input-field text-sm"
              value={formData.areaInjected || ''}
              onChange={(e) => setFormData({ ...formData, areaInjected: e.target.value })}
            />
          </div>

          {/* Quantity, Unit, Technique, Anesthesia */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-surface-50 p-3.5 rounded-lg border border-surface-200">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">
                الكمية المستخدمة <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                required
                placeholder="مثال: 1.0"
                className="input-field text-sm"
                value={formData.quantityUsed || ''}
                onChange={(e) => setFormData({ ...formData, quantityUsed: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">وحدة القياس</label>
              <select
                className="input-field text-sm"
                value={formData.quantityUnit || 'ml'}
                onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
              >
                <option value="ml">مل (ml / cc)</option>
                <option value="syringe">سرنجة كاملة (Syringe)</option>
                <option value="units">وحدات بوتوكس (Units)</option>
                <option value="ampoule">أمبول (Ampoule)</option>
                <option value="threads">خيوط (Threads)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">تقنية الحقن Technique</label>
              <select
                className="input-field text-sm"
                value={formData.techniqueUsed || ''}
                onChange={(e) => setFormData({ ...formData, techniqueUsed: e.target.value })}
              >
                <option value="كانيولا دقيقة (Cannula)">كانيولا (Cannula)</option>
                <option value="إبرة دقيقة (Needle)">إبرة دقيقة (Needle)</option>
                <option value="خطي تراجعي (Linear Retrograde)">خطي تراجعي (Linear)</option>
                <option value="نقطي عميق (Bolus)">نقطي عميق (Bolus)</option>
                <option value="مروحي (Fan Technique)">مروحي (Fan Technique)</option>
                <option value="ميكرو دروبلت (Micro-droplet)">ميكرو دروبلت (Micro-droplet)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">التخدير الموضعي</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={formData.anesthesiaUsed || false}
                  onChange={(e) => setFormData({ ...formData, anesthesiaUsed: e.target.checked })}
                />
                <span className="text-xs font-bold text-surface-800">استخدام بنج موضعي (Topical)</span>
              </label>
            </div>
          </div>

          {/* Follow-up date */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              موعد المتابعة والاستشارة (Follow-up Date)
            </label>
            <input
              type="date"
              className="input-field text-sm max-w-sm"
              value={formData.followUpDate || ''}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* ======================= SKIN CARE FORM ======================= */}
      {sessionType === 'SKIN_CARE' && (
        <div className="space-y-5 bg-white p-5 rounded-xl border border-primary-300 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <h4 className="font-bold text-surface-900 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-600" />
              تفاصيل جلسة العناية بالبشرة والإجراءات
            </h4>
            <span className="text-xs text-surface-500">جلسات النضارة، الهيدرافيشل، التقشير، الديرمابن</span>
          </div>

          {/* Procedure Name with Presets */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1.5">
              اسم الإجراء المعالج <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {skinCareProcedures.map((proc) => (
                <button
                  key={proc}
                  type="button"
                  onClick={() => setFormData({ ...formData, procedureName: proc })}
                  className="text-xs bg-white text-surface-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 px-3 py-1.5 rounded-full border border-surface-200 transition-colors shadow-sm font-medium"
                >
                  {proc}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              placeholder="مثال: جلسة هيدرافيشل ملكي مع ماسك الذهب..."
              className="input-field text-sm"
              value={formData.procedureName || ''}
              onChange={(e) => setFormData({ ...formData, procedureName: e.target.value })}
            />
          </div>

          {/* Products Used */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              المواد والسيرومات والأحماض المستخدمة (Products & Serums)
            </label>
            <textarea
              rows={2}
              placeholder="مثال: سيروم حمض الهيالورونيك، فيتامين سي 20%، حمض الساليسيليك 2%، ماسك الكولاجين..."
              className="input-field text-sm"
              value={formData.productsUsed || ''}
              onChange={(e) => setFormData({ ...formData, productsUsed: e.target.value })}
            ></textarea>
          </div>

          {/* Follow-up date */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              موعد الجلسة التالية المقترح
            </label>
            <input
              type="date"
              className="input-field text-sm max-w-sm"
              value={formData.followUpDate || ''}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* ======================= CLINICAL PHOTOS (ALL TYPES) ======================= */}
      <div className="bg-white p-5 rounded-xl border border-primary-300 shadow-sm space-y-4">
        <h4 className="font-bold text-surface-900 flex items-center gap-2 text-sm">
          <Camera className="w-4 h-4 text-primary-600" />
          التوثيق الفوتوغرافي للجلسة (قبل / أثناء / بعد)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Photo Before */}
          <div className="border-2 border-dashed border-surface-200 rounded-xl p-3 text-center hover:border-primary-400 transition-colors">
            <label className="block text-xs font-bold text-surface-700 mb-2">صورة قبل الجلسة (Before)</label>
            {photoPreviews.before ? (
              <div className="relative inline-block">
                <img
                  src={photoPreviews.before}
                  alt="قبل"
                  className="w-32 h-32 object-cover rounded-lg border border-surface-200 mx-auto"
                />
                <button
                  type="button"
                  onClick={() => removePhoto('before')}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block py-4">
                <Camera className="w-8 h-8 text-surface-400 mx-auto mb-1" />
                <span className="text-xs text-primary-600 font-bold hover:underline block">رفع صورة قبل</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e, 'before')}
                />
              </label>
            )}
          </div>

          {/* Photo During */}
          <div className="border-2 border-dashed border-surface-200 rounded-xl p-3 text-center hover:border-primary-400 transition-colors">
            <label className="block text-xs font-bold text-surface-700 mb-2">صورة أثناء الإجراء (During)</label>
            {photoPreviews.during ? (
              <div className="relative inline-block">
                <img
                  src={photoPreviews.during}
                  alt="أثناء"
                  className="w-32 h-32 object-cover rounded-lg border border-surface-200 mx-auto"
                />
                <button
                  type="button"
                  onClick={() => removePhoto('during')}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block py-4">
                <Camera className="w-8 h-8 text-surface-400 mx-auto mb-1" />
                <span className="text-xs text-primary-600 font-bold hover:underline block">رفع صورة أثناء الجلسة</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e, 'during')}
                />
              </label>
            )}
          </div>

          {/* Photo After */}
          <div className="border-2 border-dashed border-surface-200 rounded-xl p-3 text-center hover:border-primary-400 transition-colors">
            <label className="block text-xs font-bold text-surface-700 mb-2">صورة بعد الجلسة (After)</label>
            {photoPreviews.after ? (
              <div className="relative inline-block">
                <img
                  src={photoPreviews.after}
                  alt="بعد"
                  className="w-32 h-32 object-cover rounded-lg border border-surface-200 mx-auto"
                />
                <button
                  type="button"
                  onClick={() => removePhoto('after')}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block py-4">
                <Camera className="w-8 h-8 text-surface-400 mx-auto mb-1" />
                <span className="text-xs text-primary-600 font-bold hover:underline block">رفع صورة بعد</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e, 'after')}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* ======================= CLINICAL NOTES ======================= */}
      <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-2">
        <label className="block text-xs font-bold text-surface-700">
          ملاحظات الطبيب وتوصيات العناية المنزلية (Clinical Notes & Instructions)
        </label>
        <textarea
          rows={3}
          placeholder="سجل أي ملاحظات خاصة بالحالة، استجابة المريض، المحاذير، أو تعليمات العناية اللاحقة بالمنزل..."
          className="input-field text-sm"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        ></textarea>
      </div>

    </form>
    </div>
  );
}
