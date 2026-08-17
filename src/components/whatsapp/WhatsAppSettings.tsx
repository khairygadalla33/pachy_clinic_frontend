import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Card from '../Card';
import { Save } from 'lucide-react';
import LoadingSkeleton from '../LoadingSkeleton';

export default function WhatsAppSettings({ instances = [] }: { instances: any[] }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    autoSendInvoice: false,
    autoSendInvoiceInstance: '',
    autoNotifyStatus: false,
    autoNotifyStatusInstance: '',
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
        autoSendInvoice: settings.autoSendInvoice || false,
        autoSendInvoiceInstance: settings.autoSendInvoiceInstance || '',
        autoNotifyStatus: settings.autoNotifyStatus || false,
        autoNotifyStatusInstance: settings.autoNotifyStatusInstance || '',
        autoAppointmentReminder: settings.autoAppointmentReminder || false,
        autoAppointmentReminderInstance: settings.autoAppointmentReminderInstance || ''
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.post('/whatsapp/settings', data),
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['wa-settings'] });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="font-semibold text-lg border-b pb-2 mb-4">الإعدادات التلقائية</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-xl bg-surface-50 dark:bg-surface-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">إرسال الفاتورة تلقائياً</h4>
                <p className="text-xs text-surface-500">عند إصدار فاتورة جديدة للعميل</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.autoSendInvoice} onChange={e => setFormData({...formData, autoSendInvoice: e.target.checked})} />
                <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:-translate-x-1 rtl:peer-checked:after:-translate-x-full rtl:peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            {formData.autoSendInvoice && (
              <div>
                <label className="block text-xs mb-1 text-surface-600">الرقم المرسل</label>
                <select value={formData.autoSendInvoiceInstance} onChange={e => setFormData({...formData, autoSendInvoiceInstance: e.target.value})} className="input-field w-full text-sm">
                  <option value="">-- اختر الرقم --</option>
                  {instances.map((i: any) => (
                    <option key={i.name} value={i.name}>{i.name} ({i.phone})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="p-4 border rounded-xl bg-surface-50 dark:bg-surface-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">تذكير بموعد الحجز تلقائياً</h4>
                <p className="text-xs text-surface-500">قبل الموعد بـ 24 ساعة</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.autoAppointmentReminder} onChange={e => setFormData({...formData, autoAppointmentReminder: e.target.checked})} />
                <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:-translate-x-1 rtl:peer-checked:after:-translate-x-full rtl:peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            {formData.autoAppointmentReminder && (
              <div>
                <label className="block text-xs mb-1 text-surface-600">الرقم المرسل</label>
                <select value={formData.autoAppointmentReminderInstance} onChange={e => setFormData({...formData, autoAppointmentReminderInstance: e.target.value})} className="input-field w-full text-sm">
                  <option value="">-- اختر الرقم --</option>
                  {instances.map((i: any) => (
                    <option key={i.name} value={i.name}>{i.name} ({i.phone})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </Card>
  );
}
