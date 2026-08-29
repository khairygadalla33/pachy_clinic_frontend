import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Clock,
  Users,
  CheckSquare,
  Plus,
  Calendar,
  Wallet,
  Power,
  Globe,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'ONLINE_BOOKINGS'>('QUEUE');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [isWalkInPOS, setIsWalkInPOS] = useState(false);
  const [initialClientForPOS, setInitialClientForPOS] = useState<{
    id: string;
    fullName: string;
    phone: string;
    photoUrl: string | null;
  } | null>(null);
  const { user } = useAuth();
  const branchId = user?.branchId;

  // Polling queries
  const { data: stats } = useQuery({
    queryKey: ['workflow-stats', branchId],
    queryFn: () => api.get(`/workflow/stats?branchId=${branchId}`).then((r) => r.data),
    refetchInterval: 20000,
    staleTime: 5000,
    enabled: !!branchId,
  });

  const { data: doctorGroups } = useQuery({
    queryKey: ['workflow-queue', branchId],
    queryFn: () => api.get(`/workflow/queue/by-doctor?branchId=${branchId}`).then((r) => r.data),
    refetchInterval: 20000,
    staleTime: 5000,
    enabled: !!branchId,
  });

  const { data: upcoming } = useQuery({
    queryKey: ['appointments-upcoming', branchId],
    queryFn: () =>
      api.get(`/appointments/today?branchId=${branchId}&status=PENDING,CONFIRMED`).then((r) => r.data),
    refetchInterval: 30000,
    staleTime: 10000,
    enabled: !!branchId,
  });

  // Query Online Bookings
  const { data: onlineBookingsData, isLoading: loadingOnline } = useQuery({
    queryKey: ['online-bookings-list', branchId],
    queryFn: () =>
      api
        .get(`/appointments?source=ONLINE_BOOKING&limit=50${branchId ? `&branchId=${branchId}` : ''}`)
        .then((r) => r.data),
    refetchInterval: 10000,
  });

  const onlineBookings = onlineBookingsData?.data || [];
  const pendingOnlineCount = onlineBookings.filter((b: any) => b.status === 'PENDING').length;

  // Action Mutation for Queue
  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.put(`/workflow/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
    },
  });

  // Update Online Appointment Status Mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/appointments/${id}`, { status }),
    onSuccess: () => {
      toast.success('تم تحديث حالة الحجز بنجاح');
      queryClient.invalidateQueries({ queryKey: ['online-bookings-list'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
    },
    onError: () => {
      toast.error('تعذر تحديث الحجز');
    },
  });

  // Check-in Patient from Online Booking
  const checkInMutation = useMutation({
    mutationFn: async (appointment: any) => {
      // 1. Confirm appointment
      await api.put(`/appointments/${appointment.id}`, { status: 'CONFIRMED' });
      // 2. Find workflow item and advance to WAITING
      const workflowItems = appointment.workflowItems || [];
      if (workflowItems.length > 0) {
        await api.put(`/workflow/${workflowItems[0].id}/ready`);
      }
    },
    onSuccess: () => {
      toast.success('تم تأكيد وصول المريض ونقله لطابور الانتظار بنجاح 👏');
      queryClient.invalidateQueries({ queryKey: ['online-bookings-list'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تسجيل وصول المريض');
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
      {/* Top Header & Sub-Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'QUEUE'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-rose-500" />
            <span>طابور العيادات والاستقبال</span>
          </button>

          <button
            onClick={() => setActiveTab('ONLINE_BOOKINGS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'ONLINE_BOOKINGS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>الحجوزات الأونلاين</span>
            {pendingOnlineCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {pendingOnlineCount} جديد
              </span>
            )}
          </button>
        </div>

        {/* Action Buttons & Testing App Link */}
        <div className="flex items-center gap-2">
          <a
            href="/khairy-testing-app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تطبيق حجز الموبايل</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() => {
              setIsWalkInPOS(false);
              setInitialClientForPOS(null);
              setShowPOS(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#6b4c9a] hover:opacity-90 transition-opacity shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 ml-1.5" /> حجز موعد جديد
          </button>
          <button
            onClick={() => {
              setIsWalkInPOS(true);
              setInitialClientForPOS(null);
              setShowPOS(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#c0389f] hover:opacity-90 transition-opacity shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 ml-1.5" /> مريض بدون موعد
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: WORKFLOW QUEUE ======================= */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Main Content (Taking 4/5 of the space) */}
            <div className="md:col-span-4 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'محجوز',
                    value: stats?.BOOKED || 0,
                    icon: Clock,
                    color: 'text-surface-600 bg-surface-100 border border-surface-200',
                  },
                  {
                    label: 'في الانتظار',
                    value: stats?.WAITING || 0,
                    icon: Users,
                    color: 'text-red-600 bg-red-50 border border-red-200',
                  },
                  {
                    label: 'في الجلسة',
                    value: stats?.IN_SESSION || 0,
                    icon: Activity,
                    color: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
                  },
                  {
                    label: 'تسوية مالية',
                    value: stats?.PENDING_CHECKOUT || 0,
                    icon: CheckSquare,
                    color: 'text-blue-600 bg-blue-50 border border-blue-200',
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`py-2.5 px-3 rounded-xl shadow-xs flex items-center gap-3 ${s.color}`}
                  >
                    <s.icon className="w-5 h-5 opacity-75 shrink-0" />
                    <div className="flex flex-col justify-center">
                      <p className="text-xl font-bold leading-none">{s.value}</p>
                      <p className="text-[11px] font-medium uppercase tracking-wider opacity-75 mt-1 leading-none">
                        {s.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shift Custody Box (Taking 1/5 of the space) */}
            <div className="md:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-xs p-3 text-white flex flex-col justify-between min-h-full">
              <div>
                <h3 className="font-bold text-xs mb-1 flex items-center gap-1.5 text-emerald-100">
                  <Wallet className="w-4 h-4" /> عهدة الشفت الحالي
                </h3>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-3xl font-bold font-mono tracking-wider leading-none">0</span>
                  <span className="text-xs font-medium text-emerald-100 mb-0.5">ج.م</span>
                </div>
              </div>
              <button
                onClick={() => setShowEndShiftModal(true)}
                className="w-full mt-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold py-1 text-xs rounded shadow-xs transition-colors flex items-center justify-center gap-1.5 group"
              >
                <Power className="w-3.5 h-3.5 text-emerald-500 group-hover:text-red-500 transition-colors" />{' '}
                إنهاء الشفت
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
                          <div className="font-medium text-surface-900">
                            {apt.client?.fullName || 'عميل غير محدد'}
                          </div>
                          <div className="text-xs text-surface-500">{apt.client?.phone || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-surface-700">
                          {apt.appointmentServices
                            ?.map((as: any) => as.service?.nameAr || as.service?.name)
                            .join(' + ') ||
                            apt.service?.nameAr ||
                            apt.service?.name ||
                            'بدون خدمة'}
                        </td>
                        <td className="px-4 py-3 text-surface-700">
                          {apt.staff?.fullName ? `د. ${apt.staff.fullName}` : 'غير محدد'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={apt.status === 'CONFIRMED' ? 'success' : 'warning'}>
                            {translateStatus(apt.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ======================= TAB 2: ONLINE BOOKINGS ======================= */}
      {activeTab === 'ONLINE_BOOKINGS' && (
        <div className="space-y-4">
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <span>قائمة الحجوزات الواردة من تطبيق الموبايل</span>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  إجمالي الحجوزات: {onlineBookings.length}
                </span>
              </div>
            }
          >
            {loadingOnline ? (
              <div className="py-12 text-center text-slate-500 text-xs font-bold">
                جاري تحميل الحجوزات الأونلاين...
              </div>
            ) : onlineBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Globe className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">لا توجد حجوزات أونلاين واردة حالياً</p>
                <p className="text-xs text-slate-400">
                  يمكن للعملاء حجز الخدمات مباشرة عبر رابط التطبيق: /khairy-testing-app
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
                    <tr>
                      <th className="px-4 py-3 font-bold">رقم الحجز والموعد</th>
                      <th className="px-4 py-3 font-bold">بيانات العميل</th>
                      <th className="px-4 py-3 font-bold">الخدمات المطلوبة</th>
                      <th className="px-4 py-3 font-bold">الأخصائية</th>
                      <th className="px-4 py-3 font-bold">الحالة</th>
                      <th className="px-4 py-3 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {onlineBookings.map((apt: any) => {
                      const refCode = `PC-${apt.id.substring(0, 6).toUpperCase()}`;
                      const dateFormatted = new Date(apt.scheduledDate).toLocaleDateString('ar-EG');
                      const isPending = apt.status === 'PENDING';

                      return (
                        <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Reference & Time */}
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                              {refCode}
                            </span>
                            <div className="text-xs font-bold text-slate-800 mt-1">
                              {dateFormatted}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {apt.startTime}
                            </div>
                          </td>

                          {/* Client */}
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">
                              {apt.client?.fullName || 'غير معروف'}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500 font-mono" dir="ltr">
                                {apt.client?.phone}
                              </span>
                              {apt.client?.phone && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const msg = encodeURIComponent(
                                      `مرحباً ${apt.client?.fullName}، نتواصل معكِ بخصوص حجزكِ رقم ${refCode} في عيادة باتشي.`
                                    );
                                    window.open(`https://wa.me/2${apt.client?.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                  }}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="مراسلة عبر واتساب"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Services */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {apt.appointmentServices?.length > 0 ? (
                                apt.appointmentServices.map((as: any, idx: number) => (
                                  <div key={idx} className="text-xs text-slate-800 font-medium">
                                    • {as.service?.nameAr || as.service?.name}
                                    {as.notes && (
                                      <span className="text-[11px] text-rose-600 mr-1">
                                        ({as.notes})
                                      </span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-slate-700">
                                  {apt.service?.nameAr || apt.service?.name || 'خدمة عامة'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Doctor */}
                          <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                            {apt.staff?.fullName ? `د. ${apt.staff.fullName}` : 'أي طبيبة متاحة'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800'
                                  : apt.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isPending ? 'طلب جديد (معلق)' : translateStatus(apt.status)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Confirm Action */}
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAppointmentMutation.mutate({
                                      id: apt.id,
                                      status: 'CONFIRMED',
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200 transition-colors"
                                  title="تأكيد الحجز"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>تأكيد</span>
                                </button>
                              )}

                              {/* Check-In Action (Send to waiting queue) */}
                              <button
                                type="button"
                                onClick={() => checkInMutation.mutate(apt)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 border border-rose-200 transition-colors"
                                title="تسجيل وصول المريض للعيادة ونقله للانتظار"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>تسجيل وصول</span>
                              </button>

                              {/* Cancel Action */}
                              {apt.status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('هل أنتِ متأكدة من رغبتك في إلغاء هذا الحجز؟')) {
                                      updateAppointmentMutation.mutate({
                                        id: apt.id,
                                        status: 'CANCELLED',
                                      });
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="إلغاء الحجز"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* End Shift Placeholder Modal */}
      <Modal
        isOpen={showEndShiftModal}
        onClose={() => setShowEndShiftModal(false)}
        title="إنهاء الشفت الحالي"
      >
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
    </div>
  );
}
