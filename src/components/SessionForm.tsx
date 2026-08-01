import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface SessionFormProps {
  type: 'LASER' | 'INJECTION' | 'SKIN_CARE';
  appointmentId: string;
  clientId: string;
  serviceId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SessionForm({ type, appointmentId, clientId, serviceId, onSuccess, onCancel }: SessionFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});
  
  // File state
  const [photos, setPhotos] = useState<{ before?: File, after?: File }>({});

  // Fetch Pricing for Laser
  const { data: service } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => api.get(`/services/${serviceId}`).then(r => r.data),
    enabled: !!serviceId,
  });

  // Calculate Laser Cost dynamically
  let calculatedCost = 0;
  if (type === 'LASER' && service && formData.pricingId) {
    const pricing = service.pricings.find((p: any) => p.id === formData.pricingId);
    if (pricing) {
      if (pricing.pricingModel === 'PER_AREA') calculatedCost = Number(pricing.price);
      if (pricing.pricingModel === 'PER_PULSE') calculatedCost = (formData.numberOfPulses || 0) * Number(pricing.pricePerPulse || 0);
      if (pricing.pricingModel === 'HYBRID') calculatedCost = Number(pricing.price) + ((formData.numberOfPulses || 0) * Number(pricing.pricePerPulse || 0));
    }
  }

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      let endpoint = '';
      if (type === 'LASER') endpoint = '/sessions/laser';
      else if (type === 'INJECTION') endpoint = '/sessions/injection';
      else endpoint = '/sessions/skin-care';

      const res = await api.post(endpoint, {
        appointmentId,
        clientId,
        ...data,
      });

      const sessionId = res.data.id;
      const typeStr = type.toLowerCase().replace('_', '-');

      // Upload photos if any
      if (photos.before) {
        const formData = new FormData();
        formData.append('file', photos.before);
        await api.post(`/sessions/${typeStr}/${sessionId}/photos/photoBeforeUrl`, formData);
      }
      if (photos.after) {
        const formData = new FormData();
        formData.append('file', photos.after);
        await api.post(`/sessions/${typeStr}/${sessionId}/photos/photoAfterUrl`, formData);
      }

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, prefix: 'before' | 'after') => {
    if (e.target.files && e.target.files[0]) {
      setPhotos({ ...photos, [prefix]: e.target.files[0] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === 'LASER' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">نموذج التسعير / المنطقة</label>
              <select 
                className="input-field" 
                required
                value={formData.pricingId || ''} 
                onChange={e => {
                  const pricing = service?.pricings.find((p: any) => p.id === e.target.value);
                  setFormData({ ...formData, pricingId: e.target.value, bodyArea: pricing?.bodyArea || '' })
                }}
              >
                <option value="">اختر المنطقة/التسعير...</option>
                {service?.pricings?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.bodyArea} ({p.pricingModel})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">عدد النبضات</label>
              <input 
                type="number" 
                className="input-field"
                value={formData.numberOfPulses || ''}
                onChange={e => setFormData({ ...formData, numberOfPulses: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Energy (J/cm²)</label>
              <input type="number" step="0.1" className="input-field" onChange={e => setFormData({ ...formData, energyLevel: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Pulse Width (ms)</label>
              <input type="number" step="0.1" className="input-field" onChange={e => setFormData({ ...formData, pulseWidth: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Spot Size (mm)</label>
              <input type="number" step="0.1" className="input-field" onChange={e => setFormData({ ...formData, spotSize: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">رقم الجلسة</label>
              <input type="number" className="input-field" required onChange={e => setFormData({ ...formData, sessionNumber: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Skin Reaction</label>
              <select className="input-field" onChange={e => setFormData({ ...formData, skinReaction: e.target.value })}>
                <option value="NONE">None</option>
                <option value="MILD_REDNESS">Mild Redness</option>
                <option value="MODERATE_REDNESS">Moderate Redness</option>
                <option value="SEVERE_REDNESS">Severe Redness</option>
                <option value="BLISTERING">Blistering</option>
                <option value="PIGMENTATION">Pigmentation Change</option>
              </select>
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold flex justify-between items-center">
            <span>التكلفة المحسوبة:</span>
            <span>{calculatedCost.toFixed(2)} EGP</span>
          </div>
        </div>
      )}

      {type === 'INJECTION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">المنتج المستخدم</label>
              <input type="text" className="input-field" required onChange={e => setFormData({ ...formData, productUsed: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">منطقة الحقن</label>
              <input type="text" className="input-field" required onChange={e => setFormData({ ...formData, areaInjected: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">الكمية المستخدمة</label>
              <input type="number" step="0.1" className="input-field" required onChange={e => setFormData({ ...formData, quantityUsed: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">وحدة الكمية (ml/units)</label>
              <input type="text" className="input-field" onChange={e => setFormData({ ...formData, quantityUnit: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {type === 'SKIN_CARE' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">اسم الإجراء</label>
            <input type="text" className="input-field" required onChange={e => setFormData({ ...formData, procedureName: e.target.value })} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-200">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">صورة قبل</label>
          <input type="file" accept="image/*" className="w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={e => handlePhotoChange(e, 'before')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">صورة بعد</label>
          <input type="file" accept="image/*" className="w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={e => handlePhotoChange(e, 'after')} />
        </div>
      </div>

      <div className="pt-4 border-t border-surface-200">
        <label className="block text-sm font-medium text-surface-700 mb-1">ملاحظات</label>
        <textarea rows={2} className="input-field" onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
        <button type="button" onClick={onCancel} className="btn-secondary">إلغاء</button>
        <button type="submit" disabled={submitMutation.isPending} className="btn-primary">
          {submitMutation.isPending ? 'جاري الحفظ...' : 'حفظ الجلسة'}
        </button>
      </div>
    </form>
  );
}
