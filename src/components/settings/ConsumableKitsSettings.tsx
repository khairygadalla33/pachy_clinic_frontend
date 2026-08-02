import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../Card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../Modal';

export default function ConsumableKitsSettings() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Note: Consumables schema typically involves serviceId, consumableItemId (product), quantity, isRequired
  const [formData, setFormData] = useState({ serviceId: '', consumableItemId: '', quantity: 1, isRequired: true });

  const { data: consumables = [], isLoading } = useQuery({
    queryKey: ['consumables'],
    queryFn: () => api.get('/consumables').then(r => r.data),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services-list'],
    queryFn: () => api.get('/services').then(r => r.data),
  });
  
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => api.get('/inventory/products').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/consumables', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consumables'] }); setIsModalOpen(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/consumables/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consumables'] }); setIsModalOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/consumables/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consumables'] })
  });

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        serviceId: item.serviceId, 
        consumableItemId: item.consumableItemId, 
        quantity: item.quantity, 
        isRequired: item.isRequired 
      });
    } else {
      setEditingItem(null);
      setFormData({ serviceId: services[0]?.id || '', consumableItemId: inventory.data?.[0]?.id || '', quantity: 1, isRequired: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, quantity: Number(formData.quantity) };
    if (editingItem) updateMutation.mutate({ id: editingItem.id, data: payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">مجموعات المستهلكات (Kits)</h2>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة مستهلك لخدمة
        </button>
      </div>

      <Card>
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b text-surface-500">
              <th className="pb-3 px-4">الخدمة</th>
              <th className="pb-3 px-4">المنتج (المستهلك)</th>
              <th className="pb-3 px-4">الكمية</th>
              <th className="pb-3 px-4">إلزامي؟</th>
              <th className="pb-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {isLoading ? <tr><td colSpan={5} className="text-center py-4">جاري التحميل...</td></tr> : 
              consumables.map((c: any) => (
                <tr key={c.id} className="hover:bg-surface-50">
                  <td className="py-3 px-4 font-medium">{c.service?.name}</td>
                  <td className="py-3 px-4">{c.consumableItem?.name}</td>
                  <td className="py-3 px-4 font-bold">{c.quantity}</td>
                  <td className="py-3 px-4">{c.isRequired ? 'نعم' : 'لا'}</td>
                  <td className="py-3 px-4 flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(c)} className="p-1 text-surface-400 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm('تأكيد الحذف؟')) deleteMutation.mutate(c.id); }} className="p-1 text-surface-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'تعديل مستهلك الخدمة' : 'إضافة مستهلك لخدمة'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الخدمة *</label>
            <select required value={formData.serviceId} onChange={e => setFormData({...formData, serviceId: e.target.value})} className="input-field w-full">
              <option value="">اختر الخدمة...</option>
              {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المنتج (المستهلك) *</label>
            <select required value={formData.consumableItemId} onChange={e => setFormData({...formData, consumableItemId: e.target.value})} className="input-field w-full">
              <option value="">اختر المنتج...</option>
              {inventory.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الكمية *</label>
            <input required type="number" min="0.01" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 1})} className="input-field w-full" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="isRequired" checked={formData.isRequired} onChange={e => setFormData({...formData, isRequired: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-600" />
            <label htmlFor="isRequired" className="text-sm font-medium">مستهلك إلزامي (يتم خصمه تلقائياً)</label>
          </div>
          <div className="flex justify-end pt-4"><button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">حفظ</button></div>
        </form>
      </Modal>
    </div>
  );
}
