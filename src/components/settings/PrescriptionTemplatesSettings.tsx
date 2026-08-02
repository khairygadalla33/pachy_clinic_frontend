import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../Card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../Modal';

export default function PrescriptionTemplatesSettings() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['prescription-templates'],
    queryFn: () => api.get('/prescription-templates').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/prescription-templates', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prescription-templates'] }); setIsModalOpen(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/prescription-templates/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prescription-templates'] }); setIsModalOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/prescription-templates/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prescription-templates'] })
  });

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        name: item.name, 
        medicineName: item.medicineName, 
        dosage: item.dosage, 
        frequency: item.frequency, 
        duration: item.duration, 
        instructions: item.instructions || '' 
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) updateMutation.mutate({ id: editingItem.id, data: formData });
    else createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">قوالب الروشتات</h2>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> قالب جديد
        </button>
      </div>

      <Card>
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b text-surface-500">
              <th className="pb-3 px-4">اسم القالب</th>
              <th className="pb-3 px-4">الدواء</th>
              <th className="pb-3 px-4">الجرعة والتكرار</th>
              <th className="pb-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {isLoading ? <tr><td colSpan={4} className="text-center py-4">جاري التحميل...</td></tr> : 
              templates.map((t: any) => (
                <tr key={t.id} className="hover:bg-surface-50">
                  <td className="py-3 px-4 font-medium">{t.name}</td>
                  <td className="py-3 px-4">{t.medicineName}</td>
                  <td className="py-3 px-4">{t.dosage} - {t.frequency} ({t.duration})</td>
                  <td className="py-3 px-4 flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(t)} className="p-1 text-surface-400 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm('تأكيد الحذف؟')) deleteMutation.mutate(t.id); }} className="p-1 text-surface-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'تعديل قالب' : 'قالب جديد'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">اسم القالب *</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field w-full" /></div>
          <div><label className="block text-sm font-medium mb-1">اسم الدواء *</label><input required type="text" value={formData.medicineName} onChange={e => setFormData({...formData, medicineName: e.target.value})} className="input-field w-full" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">الجرعة *</label><input required type="text" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} className="input-field w-full" /></div>
            <div><label className="block text-sm font-medium mb-1">التكرار *</label><input required type="text" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})} className="input-field w-full" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">المدة *</label><input required type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="input-field w-full" /></div>
          <div><label className="block text-sm font-medium mb-1">ملاحظات</label><textarea value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} className="input-field w-full" rows={3}></textarea></div>
          <div className="flex justify-end pt-4"><button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">حفظ</button></div>
        </form>
      </Modal>
    </div>
  );
}
