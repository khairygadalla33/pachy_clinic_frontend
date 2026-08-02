import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../Card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../Modal';

export default function BranchSettings() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/branches', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); setIsModalOpen(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/branches/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); setIsModalOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/branches/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] })
  });

  const handleOpenModal = (branch?: any) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({ name: branch.name, address: branch.address || '', phone: branch.phone || '' });
    } else {
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) updateMutation.mutate({ id: editingBranch.id, data: formData });
    else createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">إدارة الفروع</h2>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> فرع جديد
        </button>
      </div>

      <Card>
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b text-surface-500">
              <th className="pb-3 px-4">اسم الفرع</th>
              <th className="pb-3 px-4">العنوان</th>
              <th className="pb-3 px-4">الهاتف</th>
              <th className="pb-3 px-4">الحالة</th>
              <th className="pb-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {isLoading ? <tr><td colSpan={5} className="text-center py-4">جاري التحميل...</td></tr> : 
              branches.map((branch: any) => (
                <tr key={branch.id} className="hover:bg-surface-50">
                  <td className="py-3 px-4 font-medium">{branch.name}</td>
                  <td className="py-3 px-4">{branch.address || '-'}</td>
                  <td className="py-3 px-4">{branch.phone || '-'}</td>
                  <td className="py-3 px-4">{branch.isActive ? 'نشط' : 'غير نشط'}</td>
                  <td className="py-3 px-4 flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(branch)} className="p-1 text-surface-400 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm('تأكيد الحذف؟')) deleteMutation.mutate(branch.id); }} className="p-1 text-surface-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBranch ? 'تعديل فرع' : 'فرع جديد'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم الفرع *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">العنوان</label>
            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الهاتف</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field w-full" />
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">حفظ</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
