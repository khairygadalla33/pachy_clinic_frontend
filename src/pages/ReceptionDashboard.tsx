import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Clock, Users, LogIn, CheckSquare, Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import Card from '../components/Card';
import Badge from '../components/Badge';
import WorkflowQueuePanel from '../components/WorkflowQueuePanel';
import CheckoutInvoiceModal from '../components/appointments/CheckoutInvoiceModal';
import AppointmentPOSModal from '../components/appointments/AppointmentPOSModal';
import { translateStatus } from '../lib/utils';

export default function ReceptionDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [showPOS, setShowPOS] = useState(false);
  const [isWalkInPOS, setIsWalkInPOS] = useState(false);
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
      <div className="flex items-center justify-start gap-3">
        <button onClick={() => { setIsWalkInPOS(false); setShowPOS(true); }} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-[#6b4c9a] hover:opacity-90 transition-opacity">
          <Calendar className="w-4 h-4 ml-2" /> حجز موعد جديد
        </button>
        <button onClick={() => { setIsWalkInPOS(true); setShowPOS(true); }} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-[#c0389f] hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4 ml-2" /> مريض بدون موعد
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'محجوز', value: stats?.BOOKED || 0, icon: Clock, color: 'text-surface-600 bg-surface-100 border border-surface-200' },
          { label: 'حضر', value: stats?.ARRIVED || 0, icon: LogIn, color: 'text-yellow-600 bg-yellow-50 border border-yellow-200' },
          { label: 'في الانتظار', value: stats?.WAITING || 0, icon: Users, color: 'text-red-600 bg-red-50 border border-red-200' },
          { label: 'في الجلسة', value: stats?.IN_SESSION || 0, icon: Activity, color: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
          { label: 'تسوية مالية', value: stats?.PENDING_CHECKOUT || 0, icon: CheckSquare, color: 'text-blue-600 bg-blue-50 border border-blue-200' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-xl shadow-sm ${s.color}`}>
            <div className="flex items-center gap-3">
              <s.icon className="w-6 h-6 opacity-75" />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium uppercase tracking-wider opacity-75">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Queue Panel */}
      <WorkflowQueuePanel 
        doctorGroups={doctorGroups || []} 
        onAction={handleAction} 
        onViewClient={handleViewClient} 
        onCheckout={(item) => setCheckoutItem(item)}
      />

      <CheckoutInvoiceModal 
        queueItem={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
          queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
        }}
      />

      {showPOS && (
        <AppointmentPOSModal 
          onClose={() => setShowPOS(false)}
          onSuccess={() => {
            setShowPOS(false);
            queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
            queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
          }}
          isWalkIn={isWalkInPOS}
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
