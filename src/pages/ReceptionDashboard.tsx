import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Clock, Users, LogIn, CheckSquare, Plus, Calendar, Wallet, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import Card from '../components/Card';
import Badge from '../components/Badge';
import WorkflowQueuePanel from '../components/WorkflowQueuePanel';
import CheckoutInvoiceModal from '../components/appointments/CheckoutInvoiceModal';
import AppointmentPOSModal from '../components/appointments/AppointmentPOSModal';
import Modal from '../components/Modal';
import { translateStatus } from '../lib/utils';

export default function ReceptionDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [isWalkInPOS, setIsWalkInPOS] = useState(false);
  const [initialClientForPOS, setInitialClientForPOS] = useState<{ id: string, fullName: string, phone: string, photoUrl: string | null } | null>(null);
  const { user } = useAuth();
  const branchId = user?.branchId;

  // Polling queries
  const { data: stats } = useQuery({
    queryKey: ['workflow-stats', branchId],
    queryFn: () => api.get(`/workflow/stats?branchId=${branchId}`).then(r => r.data),
    refetchInterval: 10000,
    enabled: !!branchId,
  });

  const { data: doctorGroups } = useQuery({
    queryKey: ['workflow-queue', branchId],
    queryFn: () => api.get(`/workflow/queue/by-doctor?branchId=${branchId}`).then(r => r.data),
    refetchInterval: 10000,
    enabled: !!branchId,
  });

  const { data: upcoming } = useQuery({
    queryKey: ['appointments-upcoming', branchId],
    queryFn: () => api.get(`/appointments/today?branchId=${branchId}&status=PENDING,CONFIRMED`).then(r => r.data),
    refetchInterval: 30000,
    enabled: !!branchId,
  });

  // Action Mutation
  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api.put(`/workflow/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
    },
  });

  const handleAction = (itemId: string, action: string) => {
    actionMutation.mutate({ id: itemId, action });
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Main Content (Taking 4/5 of the space) */}
        <div className="md:col-span-4 space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-start gap-3">
            <button onClick={() => { setIsWalkInPOS(false); setInitialClientForPOS(null); setShowPOS(true); }} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-[#6b4c9a] hover:opacity-90 transition-opacity">
              <Calendar className="w-4 h-4 ml-2" /> حجز موعد جديد
            </button>
            <button onClick={() => { setIsWalkInPOS(true); setInitialClientForPOS(null); setShowPOS(true); }} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-[#c0389f] hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4 ml-2" /> مريض بدون موعد
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'محجوز', value: stats?.BOOKED || 0, icon: Clock, color: 'text-surface-600 bg-surface-100 border border-surface-200' },
              { label: 'في الانتظار', value: stats?.WAITING || 0, icon: Users, color: 'text-red-600 bg-red-50 border border-red-200' },
              { label: 'في الجلسة', value: stats?.IN_SESSION || 0, icon: Activity, color: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
              { label: 'تسوية مالية', value: stats?.PENDING_CHECKOUT || 0, icon: CheckSquare, color: 'text-blue-600 bg-blue-50 border border-blue-200' },
            ].map((s, i) => (
              <div key={i} className={`py-2.5 px-3 rounded-xl shadow-sm flex items-center gap-3 ${s.color}`}>
                <s.icon className="w-5 h-5 opacity-75 shrink-0" />
                <div className="flex flex-col justify-center">
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wider opacity-75 mt-1 leading-none">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Custody Box (Taking 1/5 of the space) */}
        <div className="md:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-sm p-3 text-white flex flex-col justify-between min-h-full">
          <div>
            <h3 className="font-bold text-xs mb-1 flex items-center gap-1.5 text-emerald-100">
              <Wallet className="w-3.5 h-3.5" /> عهدة الشفت الحالي
            </h3>
            <div className="mt-1 flex items-end gap-1">
              <span className="text-2xl font-bold font-mono tracking-wider leading-none">0</span>
              <span className="text-xs font-medium text-emerald-100 mb-0.5">ج.م</span>
            </div>
          </div>
          <button 
            onClick={() => setShowEndShiftModal(true)}
            className="w-full mt-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold py-1.5 text-xs rounded shadow-sm transition-colors flex items-center justify-center gap-1.5 group">
            <Power className="w-3.5 h-3.5 text-emerald-500 group-hover:text-red-500 transition-colors" /> إنهاء الشفت
          </button>
        </div>
      </div>

      {/* Main Queue Panel */}
      <WorkflowQueuePanel 
        doctorGroups={doctorGroups || []} 
        onAction={handleAction} 
        onViewClient={handleViewClient} 
        onCheckout={(item) => setCheckoutItem(item)}
      />

      {/* End Shift Placeholder Modal */}
      <Modal isOpen={showEndShiftModal} onClose={() => setShowEndShiftModal(false)} title="إنهاء الشفت الحالي">
        <div className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <Power className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-surface-800">جاري برمجة الشاشة</h2>
          <p className="text-surface-500 font-medium">Khairy Gadalla</p>
          <div className="pt-6">
            <button
              onClick={() => setShowEndShiftModal(false)}
              className="bg-surface-200 hover:bg-surface-300 text-surface-800 px-6 py-2 rounded-lg font-bold transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </Modal>

      <CheckoutInvoiceModal 
        queueItem={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
          queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
        }}
        onSuccessBookNext={(client) => {
          queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
          queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
          setInitialClientForPOS(client);
          setIsWalkInPOS(false);
          setShowPOS(true);
        }}
      />

      {showPOS && (
        <AppointmentPOSModal 
          isOpen={true}
          onClose={() => {
            setShowPOS(false);
            setInitialClientForPOS(null);
            queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
            queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
          }}
          isWalkIn={isWalkInPOS}
          branchId={branchId ?? undefined}
          initialClient={initialClientForPOS}
        />
      )}

      {/* Upcoming Appointments Table */}
      <Card title="مواعيد اليوم القادمة">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm text-right">
            <thead className="bg-surface-50 text-surface-600 border-b border-surface-200">
              <tr>
                <th className="px-4 py-3 font-semibold">الوقت</th>
                <th className="px-4 py-3 font-semibold">المريض</th>
                <th className="px-4 py-3 font-semibold">الخدمة</th>
                <th className="px-4 py-3 font-semibold">الطبيب</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {upcoming?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-surface-500">
                    لا توجد مواعيد قادمة اليوم.
                  </td>
                </tr>
              ) : (
                upcoming?.map((apt: any) => (
                  <tr key={apt.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-surface-900">{apt.startTime}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-surface-900">{apt.client?.fullName || 'عميل غير محدد'}</div>
                      <div className="text-xs text-surface-500">{apt.client?.phone || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-surface-700">
                      {apt.appointmentServices?.map((as: any) => as.service?.nameAr || as.service?.name).join(' + ') || apt.service?.nameAr || apt.service?.name || 'بدون خدمة'}
                    </td>
                    <td className="px-4 py-3 text-surface-700">{apt.staff?.fullName ? `د. ${apt.staff.fullName}` : 'غير محدد'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={apt.status === 'CONFIRMED' ? 'success' : 'warning'}>{translateStatus(apt.status)}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
