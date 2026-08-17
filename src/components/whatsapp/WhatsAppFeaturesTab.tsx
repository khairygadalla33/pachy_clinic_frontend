import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { MessageSquare } from 'lucide-react';
import LoadingSkeleton from '../LoadingSkeleton';

export default function WhatsAppFeaturesTab({ instances = [] }: { instances: any[] }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    isActive: true,
    showFloatingButton: false,
    autoSendInvoice: false,
    autoSendInvoiceInstance: '',
    autoAppointmentReminder: false,
    autoAppointmentReminderInstance: ''
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['wa-settings'],
    queryFn: () => api.get('/whatsapp/settings').then(res => res.data)
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        isActive: settings.isActive ?? true,
        showFloatingButton: settings.showFloatingButton ?? false,
        autoSendInvoice: settings.autoSendInvoice || false,
        autoSendInvoiceInstance: settings.autoSendInvoiceInstance || '',
        autoAppointmentReminder: settings.autoAppointmentReminder || false,
        autoAppointmentReminderInstance: settings.autoAppointmentReminderInstance || ''
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.post('/whatsapp/settings', data), // Should be PUT, but keeping existing endpoint
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['wa-settings'] });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateMutation.mutate(formData);
  };

  const ToggleSwitch = ({ checked, onChange, label, subLabel }: any) => (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h4 className="font-semibold text-surface-800 text-sm">{label}</h4>
        {subLabel && <p className="text-xs text-surface-500 mt-0.5">{subLabel}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:-translate-x-1 rtl:peer-checked:after:-translate-x-full rtl:peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
      </label>
    </div>
  );

  if (isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-surface-800">إعدادات الواتساب</h2>
        <button 
          onClick={() => handleSubmit()} 
          disabled={updateMutation.isPending}
          className="btn-primary bg-emerald-500 hover:bg-emerald-600 px-8 py-2.5 font-bold shadow-sm"
        >
          {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* System Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-surface-200">
            <h3 className="font-semibold text-lg text-surface-700 mb-5">إعدادات النظام</h3>
            <ToggleSwitch 
              label="تفعيل ميزة الواتساب (Globally)" 
              checked={formData.isActive} 
              onChange={(e: any) => setFormData({...formData, isActive: e.target.checked})} 
            />
            <ToggleSwitch 
              label="إظهار الزر العائم للواتساب" 
              checked={formData.showFloatingButton} 
              onChange={(e: any) => setFormData({...formData, showFloatingButton: e.target.checked})} 
            />
          </div>

          {/* Auto Send Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-surface-200">
            <h3 className="font-semibold text-lg text-surface-700 mb-5">الإرسال التلقائي</h3>
            
            <div className="mb-6">
              <ToggleSwitch 
                label="إرسال رسالة عند حفظ فاتورة" 
                checked={formData.autoSendInvoice} 
                onChange={(e: any) => setFormData({...formData, autoSendInvoice: e.target.checked})} 
              />
              {formData.autoSendInvoice && (
                <div className="flex items-center gap-3 pr-2 mt-2">
                  <span className="text-xs text-surface-500">الرقم المرسل:</span>
                  <select 
                    value={formData.autoSendInvoiceInstance} 
                    onChange={e => setFormData({...formData, autoSendInvoiceInstance: e.target.value})} 
                    className="input-field py-1.5 px-3 text-sm flex-1 bg-surface-50 border-surface-300"
                  >
                    <option value="">-- الافتراضي --</option>
                    {instances.map((i: any) => (
                      <option key={i.name} value={i.name}>{i.name} ({i.phone})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <ToggleSwitch 
                label="تذكير بموعد الحجز تلقائياً" 
                checked={formData.autoAppointmentReminder} 
                onChange={(e: any) => setFormData({...formData, autoAppointmentReminder: e.target.checked})} 
              />
              {formData.autoAppointmentReminder && (
                <div className="flex items-center gap-3 pr-2 mt-2">
                  <span className="text-xs text-surface-500">الرقم المرسل:</span>
                  <select 
                    value={formData.autoAppointmentReminderInstance} 
                    onChange={e => setFormData({...formData, autoAppointmentReminderInstance: e.target.value})} 
                    className="input-field py-1.5 px-3 text-sm flex-1 bg-surface-50 border-surface-300"
                  >
                    <option value="">-- الافتراضي --</option>
                    {instances.map((i: any) => (
                      <option key={i.name} value={i.name}>{i.name} ({i.phone})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <button className="w-full bg-surface-100 hover:bg-surface-200 text-surface-800 border border-surface-300 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
            <MessageSquare className="w-5 h-5 text-surface-600" /> إدارة متغيرات التحيات
          </button>
        </div>

        {/* Right Column: Templates Manager (Events) */}
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 flex flex-col h-[600px]">
          <h3 className="text-lg font-bold text-surface-800 p-6 pb-2">إدارة قوالب وأحداث الواتساب</h3>
          
          <div className="flex-1 flex items-center justify-center text-center p-6 text-surface-500">
            <div>
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-surface-700">قوالب الأحداث (Events Templates)</p>
              <p className="text-sm mt-2 max-w-md mx-auto">سيتم عرض قائمة أحداث النظام هنا (مثل إصدار الفاتورة، تأكيد الحجز) لتمكينك من تخصيص نصوص الرسائل التلقائية الخاصة بها.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
