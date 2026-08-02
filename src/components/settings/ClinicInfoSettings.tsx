import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../Card';
import { Save } from 'lucide-react';

export default function ClinicInfoSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  const { isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      setFormData(res.data.data || {});
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.put('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('تم الحفظ بنجاح');
    }
  });

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <Card title="بيانات العيادة">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم العيادة</label>
            <input type="text" value={formData.clinicName || ''} onChange={e => setFormData({...formData, clinicName: e.target.value})} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">العنوان الرئيسي</label>
            <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">العملة</label>
            <input type="text" value={formData.currency || 'EGP'} onChange={e => setFormData({...formData, currency: e.target.value})} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المنطقة الزمنية</label>
            <input type="text" value={formData.timezone || 'Africa/Cairo'} onChange={e => setFormData({...formData, timezone: e.target.value})} className="input-field w-full" />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>
    </Card>
  );
}
