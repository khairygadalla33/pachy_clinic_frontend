import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ClientAutocomplete from '../components/ClientAutocomplete';

export default function Appointments() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  
  const [showModal, setShowModal] = useState(searchParams.get('newWalkIn') === 'true');
  const [isWalkIn, setIsWalkIn] = useState(searchParams.get('newWalkIn') === 'true');

  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    depositAmount: '',
    depositMethod: 'CASH',
    notes: '',
    source: 'phone',
  });

  const branchId = '022d4f55-1f8d-4f11-9a70-4f5b2b2b1e1b';

  // Data fetching
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', page, dateFilter],
    queryFn: () => api.get('/appointments', { params: { page, limit: 15, date: dateFilter, branchId } }).then(r => r.data),
  });

  const { data: services } = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => api.get('/services').then(r => r.data.data),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff', 'doctors'],
    queryFn: () => api.get('/users', { params: { role: 'DOCTOR' } }).then(r => r.data.data),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint = isWalkIn ? '/appointments/walk-in' : '/appointments';
      return api.post(endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      setShowModal(false);
      if (searchParams.has('newWalkIn')) {
        searchParams.delete('newWalkIn');
        setSearchParams(searchParams);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      clientId: formData.clientId,
      serviceId: formData.serviceId,
      staffId: formData.staffId,
      branchId,
      notes: formData.notes,
      source: formData.source,
    };

    if (formData.depositAmount) {
      payload.depositAmount = Number(formData.depositAmount);
      payload.depositMethod = formData.depositMethod;
    }

    if (!isWalkIn) {
      payload.scheduledDate = new Date(formData.scheduledDate).toISOString();
      payload.startTime = formData.startTime;
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">المواعيد</h1>
          <p className="text-surface-500 text-sm mt-1">إدارة جميع مواعيد العيادة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsWalkIn(true); setShowModal(true); }} className="btn-secondary">
            <Plus className="w-4 h-4 mr-2" /> Walk-in
          </button>
          <button onClick={() => { setIsWalkIn(false); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> New Appointment
          </button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-surface-200 flex gap-4 -m-6 mb-6">
          <input 
            type="date"
            className="input-field max-w-xs"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-sm text-primary-600 hover:underline">
              Clear Date Filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => <LoadingSkeleton key={i} />)}
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-50 text-surface-600 border-b border-surface-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">التاريخ والوقت</th>
                  <th className="px-4 py-3 font-semibold">العميل</th>
                  <th className="px-4 py-3 font-semibold">الخدمة</th>
                  <th className="px-4 py-3 font-semibold">الطبيب</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {appointments?.data?.map((apt: any) => (
                  <tr key={apt.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-surface-900">{new Date(apt.scheduledDate).toLocaleDateString()}</div>
                      <div className="text-xs text-surface-500">{apt.startTime} {apt.endTime ? `- ${apt.endTime}` : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-surface-900">{apt.client.fullName}</div>
                      <div className="text-xs text-surface-500">{apt.client.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-surface-700">{apt.service.name}</td>
                    <td className="px-4 py-3 text-surface-700">Dr. {apt.staff.fullName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        apt.status === 'CONFIRMED' ? 'success' :
                        apt.status === 'PENDING' ? 'warning' :
                        apt.status === 'IN_PROGRESS' ? 'info' :
                        apt.status === 'COMPLETED' ? 'success' : 'danger'
                      }>{apt.status}</Badge>
                      {apt.isWalkIn && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded uppercase font-bold tracking-wider">زيارة مباشرة (Walk-in)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* New Appointment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isWalkIn ? 'عميل جديد - زيارة مباشرة (Walk-in)' : 'موعد جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">العميل</label>
            <ClientAutocomplete 
              onSelect={(client) => setFormData({ ...formData, clientId: client.id })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">الخدمة</label>
              <select 
                className="input-field"
                required
                value={formData.serviceId}
                onChange={e => setFormData({ ...formData, serviceId: e.target.value })}
              >
                <option value="">اختر الخدمة...</option>
                {services?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.nameAr})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">الطبيب</label>
              <select 
                className="input-field"
                required
                value={formData.staffId}
                onChange={e => setFormData({ ...formData, staffId: e.target.value })}
              >
                <option value="">اختر الطبيب...</option>
                {staff?.map((s: any) => (
                  <option key={s.id} value={s.id}>Dr. {s.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {!isWalkIn && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">التاريخ</label>
                <input 
                  type="date"
                  className="input-field"
                  required
                  value={formData.scheduledDate}
                  onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">الوقت</label>
                <input 
                  type="time"
                  className="input-field"
                  required
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="border-t border-surface-200 pt-4 mt-4">
            <h4 className="text-sm font-bold text-surface-900 mb-3">عربون (اختياري)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">المبلغ</label>
                <input 
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  value={formData.depositAmount}
                  onChange={e => setFormData({ ...formData, depositAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">وسيلة الدفع</label>
                <select 
                  className="input-field"
                  value={formData.depositMethod}
                  onChange={e => setFormData({ ...formData, depositMethod: e.target.value })}
                >
                  <option value="CASH">نقدي</option>
                  <option value="CARD">بطاقة ائتمانية</option>
                  <option value="INSTAPAY">إنستاباي</option>
                  <option value="E_WALLET">محفظة إلكترونية</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">ملاحظات</label>
            <textarea 
              className="input-field"
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending || !formData.clientId} className="btn-primary">
              {createMutation.isPending ? 'جاري الحفظ...' : (isWalkIn ? 'إضافة زيارة مباشرة (Walk-in)' : 'حجز الموعد')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
