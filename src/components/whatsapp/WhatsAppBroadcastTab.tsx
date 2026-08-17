import { useState } from 'react';
import Card from '../Card';
import toast from 'react-hot-toast';
import { Plus, Trash2, Paperclip, Send, PauseCircle } from 'lucide-react';


import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function WhatsAppBroadcastTab({ instances = [] }: { instances: any[] }) {
  const [selectedInstance, setSelectedInstance] = useState(instances[0]?.name || '');

  const [filters, setFilters] = useState({
    gender: '',
    serviceCategory: '',
    appointmentStatus: '',
    skinType: ''
  });

  const { data: audienceEstimate, isLoading: isEstimating } = useQuery({
    queryKey: ['wa-audience-estimate', filters],
    queryFn: () => api.post('/whatsapp/audience/estimate', filters).then(r => r.data)
  });

  const [variations, setVariations] = useState([{ id: 1, text: '', attachment: null }]);
  const [minDelay, setMinDelay] = useState(15);
  const [maxDelay, setMaxDelay] = useState(45);

  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const addVariation = () => {
    setVariations([...variations, { id: Date.now(), text: '', attachment: null }]);
  };

  const removeVariation = (id: number) => {
    if (variations.length > 1) {
      setVariations(variations.filter(v => v.id !== id));
    }
  };

  const updateVariation = (id: number, text: string) => {
    setVariations(variations.map(v => v.id === id ? { ...v, text } : v));
  };



  const startBroadcast = () => {
    setIsSending(true);
    setProgress(0);
    // Simulate sending
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsSending(false);
          toast.success('تم الانتهاء من الإرسال بنجاح');
          return 100;
        }
        return p + 10;
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Instances */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
        <h2 className="text-2xl font-bold text-surface-800">حملات البرودكاست (Broadcast)</h2>

        {instances.length > 0 && (
          <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-surface-200 overflow-x-auto">
            {instances.map((inst: any) => (
              <button
                key={inst.name}
                onClick={() => setSelectedInstance(inst.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${selectedInstance === inst.name
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-surface-600 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
              >
                <div className={`w-2 h-2 rounded-full ${inst.status === 'open' ? (selectedInstance === inst.name ? 'bg-white' : 'bg-emerald-500') : 'bg-rose-500'}`}></div>
                {inst.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_20px_1.5fr] gap-6">
        {/* Left Column: Audience Selection */}
        <Card className="flex flex-col h-[700px]">
          <h3 className="text-lg font-semibold text-surface-800 mb-5">تحديد العملاء</h3>

          <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm mb-4 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1">النوع</label>
                <select
                  className="input-field w-full"
                  value={filters.gender}
                  onChange={e => setFilters({ ...filters, gender: e.target.value })}
                >
                  <option value="">الكل</option>
                  <option value="MALE">ذكر</option>
                  <option value="FEMALE">أنثى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1">نوع الخدمة الطبية</label>
                <select
                  className="input-field w-full"
                  value={filters.serviceCategory}
                  onChange={e => setFilters({ ...filters, serviceCategory: e.target.value })}
                >
                  <option value="">الكل</option>
                  <option value="LASER_HAIR_REMOVAL">إزالة الشعر بالليزر</option>
                  <option value="SKIN_CARE">العناية بالبشرة</option>
                  <option value="CRYO_CAVITATION">نحت الجسم</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1">حالة الحجز</label>
                <select
                  className="input-field w-full"
                  value={filters.appointmentStatus}
                  onChange={e => setFilters({ ...filters, appointmentStatus: e.target.value })}
                >
                  <option value="">الكل</option>
                  <option value="PENDING">معلق</option>
                  <option value="COMPLETED">مكتمل</option>
                  <option value="NO_SHOW">لم يحضر</option>
                </select>
              </div>

            </div>

            <div className="pt-4 border-t border-surface-200 flex gap-3">
              <button
                onClick={() => setFilters({ gender: '', serviceCategory: '', appointmentStatus: '', skinType: '' })}
                className="w-full btn-secondary bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 py-2.5 font-semibold"
              >
                مسح الفلاتر
              </button>
            </div>
          </div>

          <div className="flex-1 bg-surface-50 rounded-lg border border-surface-200 flex flex-col items-center justify-center p-6 text-center">
            <h4 className="text-surface-600 font-semibold mb-2">حجم الشريحة المستهدفة</h4>
            {isEstimating ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            ) : (
              <div className="text-4xl font-bold text-emerald-600">
                {audienceEstimate?.count || 0}
                <span className="text-sm font-normal text-surface-500 block mt-1">مريض مطابق</span>
              </div>
            )}
          </div>
        </Card>

        <div className="hidden lg:block w-px bg-surface-200 mx-auto h-full"></div>

        {/* Right Column: Templates & Execution */}
        <Card className="flex flex-col h-[700px]">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="text-lg font-semibold text-surface-800">صيغ الرسائل (Templates)</h3>
            <span className="text-blue-500 cursor-help" title="قم بإضافة أكثر من صيغة لتفادي الحظر. يمكنك استخدام المتغيرات مثل {name}">❓</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {variations.map((v, index) => (
              <div key={v.id} className="flex gap-3">
                <div className="flex-1">
                  <div className={`border-2 rounded-xl bg-white transition-colors ${variations.length > 1 && index === 0 ? 'border-emerald-500 shadow-sm' : 'border-surface-200 hover:border-emerald-300'}`}>
                    <textarea
                      value={v.text}
                      onChange={e => updateVariation(v.id, e.target.value)}
                      className="w-full h-32 p-3 bg-transparent border-none resize-none focus:ring-0 text-sm"
                      placeholder="اكتب رسالتك هنا..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={addVariation} className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors" title="إضافة صيغة جديدة">
                    <Plus className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors" title="إرفاق ملف">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  {variations.length > 1 && (
                    <button onClick={() => removeVariation(v.id)} className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-surface-50 p-5 rounded-xl border border-surface-200">
            <h4 className="font-semibold text-surface-800 mb-4">إعدادات الإرسال</h4>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-surface-600 whitespace-nowrap">أقل تأخير (ثواني):</span>
                <input type="number" value={minDelay} onChange={e => setMinDelay(Number(e.target.value))} className="input-field w-full py-1.5" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-surface-600 whitespace-nowrap">أقصى تأخير (ثواني):</span>
                <input type="number" value={maxDelay} onChange={e => setMaxDelay(Number(e.target.value))} className="input-field w-full py-1.5" />
              </div>
            </div>

            {!isSending ? (
              <button onClick={startBroadcast} className="w-full btn-primary bg-emerald-500 hover:bg-emerald-600 py-3 text-lg font-bold border-transparent flex items-center justify-center gap-2">
                <Send className="w-5 h-5" /> بدء الإرسال
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold text-blue-600">
                  <span>جاري الإرسال ({progress}%)</span>
                  <span>{audienceEstimate?.count || 0} رسالة</span>
                </div>
                <div className="w-full bg-surface-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <button onClick={() => setIsSending(false)} className="w-full btn-primary bg-rose-500 hover:bg-rose-600 py-3 text-lg font-bold border-transparent flex items-center justify-center gap-2">
                  <PauseCircle className="w-5 h-5" /> إيقاف الإرسال
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
