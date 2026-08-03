import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Search, Plus, Edit, Trash2, User, MapPin } from 'lucide-react';
import { formatDate, translateStatus } from '../lib/utils';
import Modal from '../components/Modal';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST',
    branchId: '',
    phone: '',
    specialization: '',
    commissionRate: ''
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        email: user.email || '',
        password: '',
        role: user.role,
        branchId: user.branchId || '',
        phone: user.phone || '',
        specialization: user.specialization || '',
        commissionRate: user.commissionRate ? String(user.commissionRate) : ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'RECEPTIONIST',
        branchId: branches[0]?.id || '',
        phone: '',
        specialization: '',
        commissionRate: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...formData };
    if (!payload.password) delete payload.password; // Don't send empty password
    if (payload.commissionRate) payload.commissionRate = Number(payload.commissionRate);
    
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const roles = ['ADMIN', 'DOCTOR', 'NURSE', 'TECHNICIAN', 'RECEPTIONIST'];
  const roleColors: any = {
    ADMIN: 'error',
    DOCTOR: 'primary',
    NURSE: 'info',
    TECHNICIAN: 'warning',
    RECEPTIONIST: 'default'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4">
        
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          مستخدم جديد
        </button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-3 pr-10 w-full"
            />
          </div>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field w-full md:w-64"
          >
            <option value="">كل الأدوار</option>
            {roles.map(r => <option key={r} value={r}>{translateStatus(r)}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500">
                <th className="pb-3 px-4 font-semibold">المستخدم</th>
                <th className="pb-3 px-4 font-semibold">الدور</th>
                <th className="pb-3 px-4 font-semibold">الفرع</th>
                <th className="pb-3 px-4 font-semibold">الحالة</th>
                <th className="pb-3 px-4 font-semibold">آخر دخول</th>
                <th className="pb-3 px-4 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-surface-500">جاري التحميل...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-surface-500">لا يوجد مستخدمين مطابقين</td></tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-surface-900 dark:text-surface-100">{user.fullName}</div>
                          <div className="text-xs text-surface-500 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={roleColors[user.role] || 'default'}>{translateStatus(user.role)}</Badge>
                    </td>
                    <td className="py-3 px-4 text-surface-600 dark:text-surface-300">
                      {user.branch ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {user.branch.name}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {user.isActive ? (
                        <Badge variant="success">نشط</Badge>
                      ) : (
                        <Badge variant="danger">غير نشط</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-surface-500 text-xs">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'لم يسجل الدخول أبداً'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(user)} className="p-1 text-surface-400 hover:text-primary-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('هل أنت متأكد من تغيير حالة المستخدم؟')) {
                              deleteMutation.mutate(user.id);
                            }
                          }} 
                          className={`p-1 transition-colors ${user.isActive ? 'text-surface-400 hover:text-rose-600' : 'text-rose-600 hover:text-rose-700'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'تعديل مستخدم' : 'مستخدم جديد'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الاسم الكامل *</label>
              <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني *</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field w-full text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{editingUser ? 'كلمة المرور (اتركه فارغاً لعدم التغيير)' : 'كلمة المرور *'}</label>
              <input required={!editingUser} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-field w-full text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الدور *</label>
              <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="input-field w-full">
                {roles.map(r => <option key={r} value={r}>{translateStatus(r)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الفرع *</label>
              <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="input-field w-full">
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field w-full" />
            </div>
            {formData.role === 'DOCTOR' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">التخصص</label>
                  <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نسبة العمولة (%)</label>
                  <input type="number" step="0.01" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: e.target.value})} className="input-field w-full" />
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
              {createMutation.isPending || updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
