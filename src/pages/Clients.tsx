import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, UserPlus, Edit } from 'lucide-react';
import api from '../lib/api';
import Card from '../components/Card';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { formatDate } from '../lib/utils';
import ClientAutocomplete from '../components/ClientAutocomplete';

export default function Clients() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', gender: 'FEMALE', skinType: '', dateOfBirth: '', age: '', region: '', address: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => api.get(`/clients?page=${page}&limit=20&search=${search}`).then(r => r.data),
  });

  const { data: nextFileNumberData } = useQuery({
    queryKey: ['nextFileNumber'],
    queryFn: () => api.get('/clients/next-file-number').then(r => r.data),
    enabled: showModal && !editingClient,
  });

  const createMutation = useMutation({
    mutationFn: (newClient: any) => api.post('/clients', newClient),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      navigate(`/clients/${res.data.id}`);
    },
    onError: (err) => {
      console.error(err);
      toast.error('خطأ في إنشاء ملف العميل');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      toast.success('تم تحديث بيانات العميل بنجاح');
    },
    onError: (err) => {
      console.error(err);
      toast.error('خطأ في تحديث بيانات العميل');
    },
  });

  const skinTypeColors: Record<string, string> = {
    TYPE_I: 'bg-rose-100 text-rose-700',
    TYPE_II: 'bg-orange-100 text-orange-700',
    TYPE_III: 'bg-amber-100 text-amber-700',
    TYPE_IV: 'bg-yellow-100 text-yellow-800',
    TYPE_V: 'bg-amber-800 text-amber-100',
    TYPE_VI: 'bg-black text-white',
  };

  const handleEditClick = (client: any) => {
    setEditingClient(client);
    setFormData({
      fullName: client.fullName || '',
      phone: client.phone || '',
      email: client.email || '',
      gender: client.gender || 'FEMALE',
      skinType: client.skinType || '',
      dateOfBirth: client.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : '',
      age: client.age ? String(client.age) : '',
      region: client.region || '',
      address: client.address || ''
    });
    setShowModal(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.email) delete (payload as any).email;
    if (!payload.skinType) delete (payload as any).skinType;
    if (!payload.dateOfBirth) delete (payload as any).dateOfBirth;
    else (payload as any).dateOfBirth = new Date(payload.dateOfBirth).toISOString();
    if (payload.age) (payload as any).age = parseInt(payload.age, 10);
    else delete (payload as any).age;
    
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4">
        
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({ fullName: '', phone: '', email: '', gender: 'FEMALE', skinType: '', dateOfBirth: '', age: '', region: '', address: '' });
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-[#c0389f] hover:opacity-90 transition-opacity gap-2"
        >
          <UserPlus className="w-5 h-5" />
          إضافة عميل جديد
        </button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1" />
          {/* Autocomplete component test if needed */}
          <div className="w-64 hidden lg:block">
            <ClientAutocomplete onSelect={(client) => navigate(`/clients/${client.id}`)} placeholder="بحث سريع..." />
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500">
                  <th className="pb-3 font-medium">رقم الملف</th>
                  <th className="pb-3 font-medium">الاسم</th>
                  <th className="pb-3 font-medium">الهاتف</th>
                  <th className="pb-3 font-medium">الجنس</th>
                  <th className="pb-3 font-medium">نوع البشرة</th>
                  <th className="pb-3 font-medium text-center">المنطقة</th>
                  <th className="pb-3 font-medium">الزيارات</th>
                  <th className="pb-3 font-medium">آخر نشاط</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {data?.data?.map((client: any) => (
                  <tr key={client.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="py-2.5">
                      <div className="font-bold text-primary-600 dark:text-primary-400">{client.fileNumber || '-'}</div>
                    </td>
                    <td className="py-2.5">
                      <div className="font-medium text-surface-900 dark:text-surface-100">{client.fullName}</div>
                    </td>
                    <td className="py-2.5 text-surface-600 dark:text-surface-300" dir="ltr">{client.phone}</td>
                    <td className="py-2.5 text-surface-600 dark:text-surface-300">
                      {client.gender === 'FEMALE' ? 'أنثى' : 'ذكر'}
                    </td>
                    <td className="py-2.5">
                      {client.skinType ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${skinTypeColors[client.skinType] || 'bg-gray-100 text-gray-800'}`}>
                          {client.skinType.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-surface-400 text-sm">غير محدد</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-surface-600 dark:text-surface-300">
                      {client.region || '-'}
                    </td>
                    <td className="py-2.5 text-surface-600 dark:text-surface-300">
                      {client.totalVisits}
                    </td>
                    <td className="py-2.5 text-surface-600 dark:text-surface-300">
                      {formatDate(client.updatedAt)}
                    </td>
                    <td className="py-2.5 text-left">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/clients/${client.id}`)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          title="عرض الملف"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(client)}
                          className="p-1.5 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                          title="تعديل البيانات"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-surface-400">
                      لم يتم العثور على عملاء
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-surface-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-100 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>
              <span className="text-sm text-surface-600">
                صفحة {page} من {data.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-100 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          )}
          </>
        )}
      </Card>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                {editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-surface-600">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">الاسم بالكامل *</label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">رقم التسجيل الطبي</label>
                  <input 
                    type="text" 
                    value={editingClient?.fileNumber || nextFileNumberData?.nextFileNumber || 'جاري التحميل...'} 
                    readOnly 
                    disabled
                    className="input-field w-full bg-surface-50 dark:bg-surface-800 text-surface-500 border-dashed cursor-not-allowed font-medium ltr:text-left rtl:text-right" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">الهاتف *</label>
                  <input required type="tel" dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field w-full text-left" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">الجنس *</label>
                  <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="input-field w-full">
                    <option value="FEMALE">أنثى</option>
                    <option value="MALE">ذكر</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">تاريخ الميلاد</label>
                  <input type="date" value={formData.dateOfBirth} onChange={e => {
                    const dob = e.target.value;
                    let ageStr = formData.age;
                    if (dob) {
                      const ageNum = new Date().getFullYear() - new Date(dob).getFullYear();
                      ageStr = ageNum.toString();
                    }
                    setFormData({...formData, dateOfBirth: dob, age: ageStr});
                  }} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">السن</label>
                  <input type="number" min="1" max="150" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="input-field w-full" placeholder="في حال عدم توفر تاريخ الميلاد" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">المنطقة</label>
                  <input type="text" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="input-field w-full" placeholder="مثال: المعادي" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">العنوان بالتفصيل</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">نوع البشرة (Fitzpatrick)</label>
                <select value={formData.skinType} onChange={e => setFormData({...formData, skinType: e.target.value})} className="input-field w-full">
                  <option value="">غير محدد (اختياري)</option>
                  <option value="TYPE_I">Type I - أبيض فاتح جداً (يحترق دائماً)</option>
                  <option value="TYPE_II">Type II - أبيض (يحترق بسهولة)</option>
                  <option value="TYPE_III">Type III - حنطي فاتح (يحترق أحياناً)</option>
                  <option value="TYPE_IV">Type IV - حنطي (يسمر بسهولة)</option>
                  <option value="TYPE_V">Type V - أسمر (نادر الاحتراق)</option>
                  <option value="TYPE_VI">Type VI - أسود (لا يحترق)</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
                  {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
