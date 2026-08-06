import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, CheckCircle, Clock, Calendar, Activity, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import WorkflowCardsPanel from '../components/WorkflowCardsPanel';
import DoctorSessionModal from '../components/DoctorSessionModal';

export default function DoctorWorkstation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const branchId = user?.branchId;
  const activeDoctorId = user?.id;

  const [activeQueueItem, setActiveQueueItem] = useState<any | null>(null);

  // Queue Polling
  const { data: queueItems, isLoading: isQueueLoading } = useQuery({
    queryKey: ['workflow-queue', branchId],
    queryFn: () => api.get('/workflow/queue/by-doctor', { params: { branchId } }).then(r => r.data),
    refetchInterval: 10000,
    enabled: !!branchId,
  });

  // History Polling
  const { data: historyItems, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['workflow-history', branchId, activeDoctorId],
    queryFn: () => api.get('/workflow/history/by-doctor', { params: { branchId, staffId: activeDoctorId } }).then(r => r.data),
    enabled: !!branchId && !!activeDoctorId,
  });

  // Filter and sort queue for logged-in doctor: IN_SESSION first (far right), then WAITING by arrival order
  const doctorQueue = (queueItems?.flatMap((group: any) => group.items).filter((q: any) => {
    const validStatuses = ['ARRIVED', 'WAITING', 'IN_SESSION'];
    if (!validStatuses.includes(q.stage)) return false;
    if (q.staffId !== activeDoctorId) return false;
    return true;
  }) || []).sort((a: any, b: any) => {
    // 1. IN_SESSION always comes first (at the far right in RTL)
    if (a.stage === 'IN_SESSION' && b.stage !== 'IN_SESSION') return -1;
    if (b.stage === 'IN_SESSION' && a.stage !== 'IN_SESSION') return 1;

    // 2. For waiting / arrived patients: sort by queuePosition or arrival/waiting time
    if (a.queuePosition && b.queuePosition) {
      return a.queuePosition - b.queuePosition;
    }
    if (a.queuePosition) return -1;
    if (b.queuePosition) return 1;

    const timeA = new Date(a.waitingStartTime || a.arrivalTime || a.createdAt).getTime();
    const timeB = new Date(b.waitingStartTime || b.arrivalTime || b.createdAt).getTime();
    return timeA - timeB;
  });

  // Derived KPI Stats
  const waitingCount = doctorQueue.filter((q: any) => q.stage === 'WAITING').length;
  const completedCount = historyItems?.length || 0;
  const inSessionCount = doctorQueue.filter((q: any) => q.stage === 'IN_SESSION').length;
  const totalToday = waitingCount + inSessionCount + completedCount;

  const handleCardClick = (item: any) => {
    setActiveQueueItem(item);
  };

  const handleCallClick = async (item: any) => {
    try {
      if (item.calledByDoctor) {
        await api.put(`/workflow/${item.id}/cancel-call`);
      } else {
        await api.put(`/workflow/${item.id}/call`);
      }
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
    } catch (err) {
      console.error('Error calling/cancelling patient call:', err);
    }
  };

  const handleEndVisit = async (queueItem: any) => {
    try {
      const appointment = queueItem.appointment;

      // 1. If not yet marked in session, start session
      if (queueItem.stage !== 'IN_SESSION') {
        await api.put(`/workflow/${queueItem.id}/start-session`);
      }

      // 2. Automatically send the latest prescription via WhatsApp if it exists and unsent
      if (appointment?.id) {
        try {
          const presRes = await api.get('/prescriptions', { params: { appointmentId: appointment.id } });
          const prescriptions = presRes.data;
          if (prescriptions && prescriptions.length > 0) {
            const latestPrescription = prescriptions[0];
            if (!latestPrescription.sentViaWhatsApp) {
              await api.post(`/prescriptions/${latestPrescription.id}/send-whatsapp`);
              toast.success('تم إرسال الروشتة عبر الواتساب بنجاح');
            }
          }
        } catch (err) {
          console.error('Failed to send WhatsApp prescription:', err);
        }
      }

      // 3. End session and transfer to reception
      await api.put(`/workflow/${queueItem.id}/end-session`);
      
      toast.success('تم إنهاء الزيارة وتحويل المريض للاستقبال للتسوية');
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
      if (activeQueueItem?.id === queueItem.id) {
        setActiveQueueItem(null);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('حدث خطأ أثناء إنهاء الزيارة: ' + (error.response?.data?.message || ''));
    }
  };

  const handleEditCompletedVisit = async (item: any) => {
    try {
      // Reopen visit back to active session
      const res = await api.put(`/workflow/${item.id}/reopen`);
      const reloadedItem = res.data;
      setActiveQueueItem(reloadedItem);
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
      toast.success('تم إعادة فتح الزيارة للتعديل');
    } catch (err: any) {
      console.error('Failed to reopen visit:', err);
      // Fallback: open modal directly with the item
      setActiveQueueItem(item);
    }
  };

  const handleSessionComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
    queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-500">إجمالي الحالات اليوم</p>
            <p className="text-2xl font-bold text-surface-900">{totalToday}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-500">في الانتظار</p>
            <p className="text-2xl font-bold text-surface-900">{waitingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-500">في الجلسة الآن</p>
            <p className="text-2xl font-bold text-surface-900">{inSessionCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-500">الحالات المكتملة</p>
            <p className="text-2xl font-bold text-surface-900">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      <WorkflowCardsPanel 
        items={doctorQueue} 
        isLoading={isQueueLoading} 
        onCardClick={handleCardClick}
        onCallClick={handleCallClick}
        onEndSession={handleEndVisit}
        activeQueueId={activeQueueItem?.id}
      />
      
      <div className="bg-white border border-surface-200 rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-surface-200 bg-surface-50 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-surface-500" />
          <h2 className="font-bold text-surface-900">سجل الجلسات المكتملة (اليوم)</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-surface-50 text-surface-500 font-medium">
              <tr>
                <th className="px-6 py-4 border-b border-surface-200">المريض</th>
                <th className="px-6 py-4 border-b border-surface-200">الخدمة</th>
                <th className="px-6 py-4 border-b border-surface-200">رقم الهاتف</th>
                <th className="px-6 py-4 border-b border-surface-200">الحالة</th>
                <th className="px-6 py-4 border-b border-surface-200">وقت الانتهاء</th>
                <th className="px-6 py-4 border-b border-surface-200 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isHistoryLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-surface-400">
                    جاري تحميل السجل...
                  </td>
                </tr>
              ) : historyItems?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-surface-400">
                    لم تقم بإنهاء أي جلسات اليوم.
                  </td>
                </tr>
              ) : (
                historyItems?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-surface-900">{item.client?.fullName || 'عميل غير محدد'}</td>
                    <td className="px-6 py-4 text-surface-600">{item.appointment?.service?.nameAr || item.appointment?.service?.name}</td>
                    <td className="px-6 py-4 text-surface-600 font-mono">{item.client?.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.stage === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {item.stage === 'COMPLETED' ? 'مكتمل (دفع)' : 'بانتظار الدفع'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-surface-500">
                      {new Date(item.updatedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEditCompletedVisit(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors shadow-sm cursor-pointer"
                        title="إعادة فتح وتعديل الزيارة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل الزيارة</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Session Modal */}
      {activeQueueItem && (
        <DoctorSessionModal 
          queueItem={activeQueueItem}
          onClose={() => setActiveQueueItem(null)}
          onSessionComplete={handleSessionComplete}
        />
      )}

    </div>
  );
}
