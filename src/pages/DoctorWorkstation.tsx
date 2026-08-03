import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, CheckCircle, Clock, Calendar, Activity } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import WorkflowCardsPanel from '../components/WorkflowCardsPanel';
import DoctorSessionModal from '../components/DoctorSessionModal';

export default function DoctorWorkstation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const branchId = user?.branchId;

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
    queryKey: ['workflow-history', branchId, user?.id],
    queryFn: () => api.get('/workflow/history/by-doctor', { params: { branchId, staffId: user?.id } }).then(r => r.data),
    enabled: !!branchId && !!user?.id,
  });

  // Filter queue for current doctor (if not admin)
  const doctorQueue = queueItems?.flatMap((group: any) => group.items).filter((q: any) => {
    const validStatuses = ['ARRIVED', 'WAITING', 'IN_SESSION'];
    if (!validStatuses.includes(q.stage)) return false;
    if (user?.role !== 'ADMIN' && q.staffId !== user?.id) return false;
    return true;
  }) || [];

  // Derived KPI Stats
  const waitingCount = doctorQueue.filter((q: any) => q.stage === 'WAITING').length;
  const completedCount = historyItems?.length || 0;
  const inSessionCount = doctorQueue.filter((q: any) => q.stage === 'IN_SESSION').length;
  const totalToday = waitingCount + inSessionCount + completedCount;

  const handleCardClick = (item: any) => {
    setActiveQueueItem(item);
  };

  const handleSessionComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
    queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-start items-center">
      </div>

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
      />

      {/* Data Grid for History */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isHistoryLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-400">
                    جاري تحميل السجل...
                  </td>
                </tr>
              ) : historyItems?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-400">
                    لم تقم بإنهاء أي جلسات اليوم.
                  </td>
                </tr>
              ) : (
                historyItems?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-surface-900">{item.client.fullName}</td>
                    <td className="px-6 py-4 text-surface-600">{item.appointment?.service?.nameAr || item.appointment?.service?.name}</td>
                    <td className="px-6 py-4 text-surface-600 font-mono">{item.client.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.stage === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {item.stage === 'COMPLETED' ? 'مكتمل (دفع)' : 'بانتظار الدفع'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-surface-500">
                      {new Date(item.updatedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
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
