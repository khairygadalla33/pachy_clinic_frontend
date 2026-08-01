import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { formatDate, calculateAge, getInitials, formatCurrency } from '../lib/utils';
import { ArrowRight, Activity, FileText, DollarSign, Pill, Camera, Edit } from 'lucide-react';

const tabs = [
  { id: 'sessions', label: 'الجلسات', icon: Activity },
  { id: 'medical', label: 'التاريخ الطبي', icon: FileText },
  { id: 'finance', label: 'المالية', icon: DollarSign },
  { id: 'prescriptions', label: 'الروشتات', icon: Pill },
  { id: 'photos', label: 'الصور', icon: Camera },
];

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sessions');
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  
  const [medicalForm, setMedicalForm] = useState({
    allergies: '', currentMedications: '', medicalConditions: '', isPregnant: false, isBreastfeeding: false, medicalNotes: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clientProfile', id],
    queryFn: () => api.get(`/api/clients/${id}/profile`).then(r => r.data),
  });

  const updateMedicalMutation = useMutation({
    mutationFn: (medData: any) => api.put(`/api/clients/${id}/medical`, medData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile', id] });
      setIsEditingMedical(false);
    }
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (formData: FormData) => api.post(`/api/clients/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile', id] });
    }
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      uploadPhotoMutation.mutate(formData);
    }
  };

  const handleEditMedicalClick = () => {
    if (data?.client) {
      setMedicalForm({
        allergies: data.client.allergies || '',
        currentMedications: data.client.currentMedications || '',
        medicalConditions: data.client.medicalConditions || '',
        isPregnant: data.client.isPregnant || false,
        isBreastfeeding: data.client.isBreastfeeding || false,
        medicalNotes: data.client.medicalNotes || ''
      });
    }
    setIsEditingMedical(true);
  };

  const saveMedical = (e: React.FormEvent) => {
    e.preventDefault();
    updateMedicalMutation.mutate(medicalForm);
  };

  if (isLoading) return <div className="p-6"><LoadingSkeleton rows={8} /></div>;
  if (!data || !data.client) return <div className="p-6 text-center text-surface-400">العميل غير موجود</div>;

  const { client, stats, timeline, invoices, prescriptions, activePackages } = data;

  const typeLabels: any = {
    LASER: 'جلسة ليزر',
    INJECTION: 'جلسة حقن',
    SKIN_CARE: 'جلسة عناية بالبشرة'
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-surface-400 hover:text-surface-600 text-sm">
        <ArrowRight className="w-4 h-4" /> العودة للقائمة
      </button>

      {/* Header Profile */}
      <Card>
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {client.photoUrl ? (
                <img src={`http://localhost:3000${client.photoUrl}`} alt={client.fullName} className="w-full h-full object-cover" />
              ) : (
                getInitials(client.fullName)
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-white dark:bg-surface-800 p-1.5 rounded-full shadow border border-surface-200 dark:border-surface-700 text-primary-600 hover:bg-surface-50"
              title="تغيير الصورة"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </div>
          
          <div className="flex-1 w-full">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{client.fullName}</h1>
                <div className="flex items-center gap-3 text-sm text-surface-500 mt-1">
                  <span>{client.gender === 'FEMALE' ? 'أنثى' : 'ذكر'}</span>
                  {client.dateOfBirth && <span>• {calculateAge(client.dateOfBirth)} سنة</span>}
                  <span dir="ltr">📱 {client.phone}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary text-sm">تعديل البيانات</button>
                <button className="btn-primary text-sm whitespace-nowrap">+ حجز موعد</button>
              </div>
            </div>
            
            {client.skinType && (
              <div className="mt-3">
                <Badge variant="info">بشرة: {client.skinType.replace('_', ' ')}</Badge>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-surface-500 text-sm mb-1">إجمالي الإنفاق</div>
          <div className="text-xl font-bold text-primary-600">{formatCurrency(stats.totalSpent)}</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-surface-500 text-sm mb-1">عدد الزيارات</div>
          <div className="text-xl font-bold">{stats.totalVisits}</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-surface-500 text-sm mb-1">المبلغ المستحق</div>
          <div className={`text-xl font-bold ${stats.dueAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {formatCurrency(stats.dueAmount)}
          </div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-surface-500 text-sm mb-1">باقات نشطة</div>
          <div className="text-xl font-bold">{stats.activePackagesCount}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-surface-200 dark:border-surface-700">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        
        {/* SESSIONS TIMELINE */}
        {activeTab === 'sessions' && (
          <Card>
            <h3 className="font-semibold text-lg mb-6">السجل الزمني للجلسات</h3>
            {timeline.length === 0 ? (
              <p className="text-surface-400 text-center py-8">لا يوجد جلسات سابقة</p>
            ) : (
              <div className="relative pr-6 space-y-6">
                <div className="absolute right-2 top-2 bottom-2 w-0.5 bg-surface-200 dark:bg-surface-700" />
                {timeline.map((session: any) => (
                  <div key={`${session._type}-${session.id}`} className="relative bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl border border-surface-100 dark:border-surface-700">
                    <div className="absolute -right-[1.35rem] top-4 w-3 h-3 rounded-full bg-primary-500 ring-4 ring-white dark:ring-surface-900" />
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-2">
                        {formatDate(session._date)} — {typeLabels[session._type]}
                      </div>
                      <Badge>{session.status}</Badge>
                    </div>
                    <div className="text-sm text-surface-500">
                      بواسطة: {session.performedBy?.fullName || 'غير محدد'}
                    </div>
                    {session.notes && <p className="text-sm mt-2 text-surface-600 dark:text-surface-300">{session.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* MEDICAL HISTORY */}
        {activeTab === 'medical' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">التاريخ الطبي</h3>
              {!isEditingMedical && (
                <button onClick={handleEditMedicalClick} className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg">
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {isEditingMedical ? (
              <form onSubmit={saveMedical} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">الحساسية (Allergies)</label>
                    <textarea value={medicalForm.allergies} onChange={e => setMedicalForm({...medicalForm, allergies: e.target.value})} className="input-field w-full h-20" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">الأدوية الحالية (Medications)</label>
                    <textarea value={medicalForm.currentMedications} onChange={e => setMedicalForm({...medicalForm, currentMedications: e.target.value})} className="input-field w-full h-20" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">الأمراض المزمنة (Conditions)</label>
                    <textarea value={medicalForm.medicalConditions} onChange={e => setMedicalForm({...medicalForm, medicalConditions: e.target.value})} className="input-field w-full h-20" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">ملاحظات طبية أخرى</label>
                    <textarea value={medicalForm.medicalNotes} onChange={e => setMedicalForm({...medicalForm, medicalNotes: e.target.value})} className="input-field w-full h-20" />
                  </div>
                </div>
                {client.gender === 'FEMALE' && (
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={medicalForm.isPregnant} onChange={e => setMedicalForm({...medicalForm, isPregnant: e.target.checked})} className="rounded text-primary-600 focus:ring-primary-500" />
                      <span>حامل</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={medicalForm.isBreastfeeding} onChange={e => setMedicalForm({...medicalForm, isBreastfeeding: e.target.checked})} className="rounded text-primary-600 focus:ring-primary-500" />
                      <span>مرضعة</span>
                    </label>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsEditingMedical(false)} className="btn-secondary">إلغاء</button>
                  <button type="submit" disabled={updateMedicalMutation.isPending} className="btn-primary">حفظ التغييرات</button>
                </div>
              </form>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div><span className="text-surface-400 block mb-1">الحساسية</span><p className="font-medium text-surface-800 dark:text-surface-200">{client.allergies || 'لا يوجد'}</p></div>
                <div><span className="text-surface-400 block mb-1">الأدوية الحالية</span><p className="font-medium text-surface-800 dark:text-surface-200">{client.currentMedications || 'لا يوجد'}</p></div>
                <div><span className="text-surface-400 block mb-1">الأمراض المزمنة</span><p className="font-medium text-surface-800 dark:text-surface-200">{client.medicalConditions || 'لا يوجد'}</p></div>
                <div><span className="text-surface-400 block mb-1">ملاحظات إضافية</span><p className="font-medium text-surface-800 dark:text-surface-200">{client.medicalNotes || 'لا يوجد'}</p></div>
                
                {client.gender === 'FEMALE' && (
                  <div className="flex gap-4 col-span-2">
                    {client.isPregnant && <Badge variant="warning">حامل</Badge>}
                    {client.isBreastfeeding && <Badge variant="info">مرضعة</Badge>}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* FINANCE */}
        {activeTab === 'finance' && (
          <Card>
            <h3 className="font-semibold text-lg mb-4">أحدث الفواتير</h3>
            {invoices.length === 0 ? (
              <p className="text-surface-400 text-center py-8">لا يوجد فواتير</p>
            ) : (
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500">
                    <th className="pb-2">رقم الفاتورة</th>
                    <th className="pb-2">التاريخ</th>
                    <th className="pb-2">المبلغ</th>
                    <th className="pb-2">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="py-3 font-mono">{inv.invoiceNumber}</td>
                      <td className="py-3">{formatDate(inv.issueDate)}</td>
                      <td className="py-3 font-bold">{formatCurrency(inv.grandTotal)}</td>
                      <td className="py-3"><Badge>{inv.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {activePackages.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-4">الباقات النشطة</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {activePackages.map((pkg: any) => (
                    <div key={pkg.id} className="p-4 border border-primary-200 bg-primary-50 dark:bg-primary-900/10 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{pkg.package.name}</div>
                        <Badge variant="success">نشط</Badge>
                      </div>
                      <div className="mt-2 text-sm text-surface-600">الجلسات المتبقية: {pkg.remainingSessions} / {pkg.totalSessions}</div>
                      <div className="text-xs text-surface-400 mt-1">تاريخ الانتهاء: {pkg.expiryDate ? formatDate(pkg.expiryDate) : 'لا ينتهي'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <Card>
            <h3 className="font-semibold text-lg mb-4">أحدث الروشتات</h3>
            {prescriptions.length === 0 ? (
              <p className="text-surface-400 text-center py-8">لا يوجد روشتات</p>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((px: any) => (
                  <div key={px.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium">{formatDate(px.createdAt)}</div>
                      <div className="text-sm text-surface-500">الطبيب: {px.doctor?.fullName}</div>
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {px.items.map((item: any) => (
                        <li key={item.id}>
                          <span className="font-medium text-surface-900 dark:text-surface-100">{item.medicineName}</span>
                          {item.dosage && <span className="text-surface-500"> — {item.dosage}</span>}
                          {item.duration && <span className="text-surface-500"> ({item.duration})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* PHOTOS */}
        {activeTab === 'photos' && (
          <Card>
            <h3 className="font-semibold text-lg mb-4">معرض الصور (قبل/بعد)</h3>
            <div className="flex flex-col items-center justify-center py-12 text-surface-400 border-2 border-dashed border-surface-200 rounded-xl">
              <Camera className="w-12 h-12 mb-3 text-surface-300" />
              <p>ميزة معرض الصور سيتم تفعيلها قريباً مع نظام التخزين السحابي</p>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
