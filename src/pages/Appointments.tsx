import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Bell, Check, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ClientAutocomplete from '../components/ClientAutocomplete';
import CalendarView from '../components/appointments/CalendarView';

export default function Appointments() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  const [showModal, setShowModal] = useState(searchParams.get('newWalkIn') === 'true');
  const [isWalkIn, setIsWalkIn] = useState(searchParams.get('newWalkIn') === 'true');

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const { user } = useAuth();
  const branchId = user?.branchId;

  // New states for calendar
  const [view, setView] = useState<'list' | 'calendar'>(() => {
    const saved = localStorage.getItem('appointments-view') as 'list' | 'calendar' | null;
    if (saved) return saved;
    return window.innerWidth < 768 ? 'list' : 'calendar';
  });
  const [timeframe, setTimeframe] = useState<'week' | 'month' | '6months' | 'year'>(() => {
    return (localStorage.getItem('appointments-timeframe') as any) || 'week';
  });
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('appointments-view', view);
    localStorage.setItem('appointments-timeframe', timeframe);
  }, [view, timeframe]);

  const systemSettings = useMemo(() => {
    return { maxSlotsPerDay: 8, appointmentInterval: 45 }; 
  }, []);

  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (timeframe === 'week') {
      end.setDate(start.getDate() + 6);
    } else if (timeframe === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    } else if (timeframe === '6months') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 6, 0);
    } else if (timeframe === 'year') {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    }
    return { startDate: start.toISOString(), endDate: end.toISOString(), start, end };
  }, [currentDate, timeframe]);

  const navigateWeek = (direction: -1 | 1) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: -1 | 1) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatWeekRange = () => {
    const s = dateRange.start;
    const e = dateRange.end;
    const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return `${s.toLocaleDateString('ar-EG', opts)} – ${e.toLocaleDateString('ar-EG', opts)}, ${e.getFullYear()}`;
  };

  // Data fetching
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', page, dateFilter, view, dateRange.startDate, dateRange.endDate],
    queryFn: () => {
      const params: any = { branchId };
      if (view === 'list') {
        params.page = page;
        params.limit = 15;
        if (dateFilter) params.date = dateFilter;
        if (selectedDoctorId) params.staffId = selectedDoctorId;
      } else {
        params.page = 1;
        params.limit = 500;
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
        if (selectedDoctorId) params.staffId = selectedDoctorId;
      }
      return api.get('/appointments', { params }).then(r => r.data);
    },
    enabled: !!branchId,
  });

  const { data: services } = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => api.get('/services').then(r => r.data),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff', 'doctors'],
    queryFn: () => api.get('/users/doctors').then(r => r.data),
  });

  const { data: doctorSchedule } = useQuery({
    queryKey: ['doctorSchedule', selectedDoctorId],
    queryFn: () => api.get(`/users/${selectedDoctorId}/schedule`).then(r => r.data),
    enabled: !!selectedDoctorId,
  });

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

  const remindMutation = useMutation({
    mutationFn: (id: string) => api.post(`/appointments/${id}/remind`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('تم إرسال التذكير بنجاح عبر الواتساب');
    },
    onError: (err: any) => {
      toast.error('فشل إرسال التذكير: ' + (err.response?.data?.message || err.message));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, status: string }) => api.put(`/appointments/${data.id}`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      setShowEditModal(false);
      setSelectedAppointment(null);
      toast.success('تم التحديث بنجاح');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.put(`/appointments/${id}`, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      setShowEditModal(false);
      setSelectedAppointment(null);
      toast.success('تم إلغاء الموعد بنجاح');
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

  const handleAddNew = (date?: Date, time?: string) => {
    setIsWalkIn(false);
    setFormData(prev => ({
      ...prev,
      scheduledDate: date ? date.toISOString().split('T')[0] : prev.scheduledDate,
      startTime: time || prev.startTime
    }));
    setShowModal(true);
  };

  const handleEdit = (apt: any) => {
    setSelectedAppointment(apt);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative w-full">
        {/* Right Side (Buttons + Doctor Filter) */}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => handleAddNew(new Date())} className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" /> موعد جديد
          </button>
          <button onClick={() => { setIsWalkIn(true); setShowModal(true); }} className="btn-secondary whitespace-nowrap hidden sm:flex">
            <Plus className="w-4 h-4 mr-2" /> Walk-in
          </button>
          
          {/* Doctor Filter */}
          <select 
            value={selectedDoctorId} 
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="input-field text-sm py-1.5 w-auto min-w-[150px]"
          >
            <option value="">كل الأطباء</option>
            {staff?.map((s: any) => (
              <option key={s.id} value={s.id}>د. {s.fullName}</option>
            ))}
          </select>
        </div>

        {/* Center (View Toggle) - Absolute positioned for exact center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center pointer-events-none">
          <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl pointer-events-auto shadow-sm">
            <button 
              onClick={() => setView('calendar')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'calendar' ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100'}`}
            >
              <CalendarIcon className="w-4 h-4" /> تقويم
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100'}`}
            >
              <List className="w-4 h-4" /> قائمة
            </button>
          </div>
        </div>

        {/* Left Side (Filters & Navigation) */}
        <div className="flex items-center gap-2 shrink-0 mr-auto">
          {view === 'calendar' ? (
            <>
              {/* Timeframe selector */}
              <select 
                value={timeframe} 
                onChange={(e: any) => {
                  setTimeframe(e.target.value);
                  setCurrentDate(new Date());
                }}
                className="input-field text-sm py-1.5 w-auto"
              >
                <option value="week">أسبوعي</option>
                <option value="month">شهري</option>
                <option value="6months">الـ 6 أشهر القادمة</option>
                <option value="year">السنة الحالية</option>
              </select>

              {/* Navigation */}
              <div className="flex items-center gap-1" dir="ltr">
                <button 
                  onClick={() => timeframe === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
                  className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded transition-colors text-surface-500"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="text-sm font-semibold text-surface-900 dark:text-surface-100 px-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded transition-colors cursor-pointer text-center"
                  title="الذهاب لليوم"
                >
                  {timeframe === 'week' ? formatWeekRange() : timeframe === 'month' ? `${dateRange.start.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}` : timeframe === 'year' ? currentDate.getFullYear() : 'Select Range'}
                </button>

                <button 
                  onClick={() => timeframe === 'week' ? navigateWeek(1) : navigateMonth(1)}
                  className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded transition-colors text-surface-500"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <input 
                type="date"
                className="input-field text-sm py-1.5 max-w-[150px]"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button onClick={() => setDateFilter('')} className="text-sm text-primary-600 hover:underline whitespace-nowrap font-medium">
                  إزالة الفلتر
                </button>
              )}
            </div>
          )}

          {/* Mobile view toggle */}
          <div className="md:hidden flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
            <button 
              onClick={() => setView('calendar')}
              className={`p-1.5 rounded transition-all flex items-center ${view === 'calendar' ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-600 hover:text-surface-900'}`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-1.5 rounded transition-all flex items-center ${view === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-600 hover:text-surface-900'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {view === 'list' ? (
          <Card className="h-full flex flex-col pt-0 mt-2">

            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => <LoadingSkeleton key={i} />)}
                </div>
              ) : (
                <table className="w-full text-sm text-right">
                  <thead className="bg-surface-50 text-surface-600 border-b border-surface-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-semibold">التاريخ والوقت</th>
                      <th className="px-4 py-3 font-semibold">العميل</th>
                      <th className="px-4 py-3 font-semibold">الخدمة</th>
                      <th className="px-4 py-3 font-semibold">الطبيب</th>
                      <th className="px-4 py-3 font-semibold">الحالة</th>
                      <th className="px-4 py-3 font-semibold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200">
                    {appointments?.data?.map((apt: any) => (
                      <tr key={apt.id} onClick={() => handleEdit(apt)} className="hover:bg-surface-50 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="font-medium text-surface-900">{new Date(apt.scheduledDate).toLocaleDateString('ar-EG')}</div>
                          <div className="text-xs text-surface-500">{apt.startTime} {apt.endTime ? `- ${apt.endTime}` : ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-surface-900">{apt.client.fullName}</div>
                          <div className="text-xs text-surface-500">{apt.client.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-surface-700">{apt.service.nameAr || apt.service.name}</td>
                        <td className="px-4 py-3 text-surface-700">د. {apt.staff.fullName}</td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            apt.status === 'CONFIRMED' ? 'success' :
                            apt.status === 'PENDING' ? 'warning' :
                            apt.status === 'IN_PROGRESS' ? 'info' :
                            apt.status === 'COMPLETED' ? 'success' : 'danger'
                          }>{apt.status}</Badge>
                          {apt.isWalkIn && <span className="mr-2 text-[10px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded uppercase font-bold tracking-wider">زيارة مباشرة (Walk-in)</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!apt.isWalkIn && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && apt.status !== 'NO_SHOW' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); remindMutation.mutate(apt.id); }}
                              disabled={remindMutation.isPending || apt.reminderSent}
                              className={`p-1.5 rounded text-xs flex items-center justify-center w-full gap-1 ${
                                apt.reminderSent 
                                  ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' 
                                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                              }`}
                              title="إرسال تذكير عبر الواتساب"
                            >
                              {apt.reminderSent ? <><Check className="w-3 h-3" /> تم التذكير</> : <><Bell className="w-3 h-3" /> إرسال تذكير</>}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        ) : (
          <CalendarView 
            appointments={appointments?.data || []} 
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onAppointmentClick={handleEdit}
            onEmptyCellClick={(date, time) => {
              if (date >= new Date(new Date().setHours(0,0,0,0))) {
                setFormData(prev => ({ ...prev, staffId: selectedDoctorId || prev.staffId }));
                handleAddNew(date, time);
              }
            }}
            timeframe={timeframe}
            maxSlotsPerDay={systemSettings.maxSlotsPerDay}
            appointmentInterval={doctorSchedule?.sessionDuration || systemSettings.appointmentInterval}
            doctorSchedule={doctorSchedule}
          />
        )}
      </div>

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
              إلغاء
            </button>
            <button type="submit" disabled={createMutation.isPending || !formData.clientId} className="btn-primary">
              {createMutation.isPending ? 'جاري الحفظ...' : (isWalkIn ? 'إضافة زيارة مباشرة (Walk-in)' : 'حجز الموعد')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedAppointment(null); }}
        title="تعديل حالة الموعد"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg space-y-2 text-sm text-surface-800 dark:text-surface-200">
              <p><strong>العميل:</strong> {selectedAppointment.client?.fullName}</p>
              <p><strong>رقم الهاتف:</strong> <span dir="ltr">{selectedAppointment.client?.phone}</span></p>
              <p><strong>الخدمة:</strong> {selectedAppointment.service?.nameAr || selectedAppointment.service?.name}</p>
              <p><strong>الطبيب:</strong> د. {selectedAppointment.staff?.fullName}</p>
              <p><strong>التاريخ والوقت:</strong> {new Date(selectedAppointment.scheduledDate).toLocaleDateString('ar-EG')} - <span dir="ltr">{selectedAppointment.startTime}</span></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">حالة الموعد</label>
              <select 
                className="input-field"
                value={selectedAppointment.status}
                onChange={(e) => setSelectedAppointment({ ...selectedAppointment, status: e.target.value })}
              >
                <option value="PENDING">قيد الانتظار (Pending)</option>
                <option value="CONFIRMED">مؤكد (Confirmed)</option>
                <option value="IN_PROGRESS">جاري التنفيذ (In Progress)</option>
                <option value="COMPLETED">مكتمل (Completed)</option>
                <option value="NO_SHOW">لم يحضر (No Show)</option>
                <option value="CANCELLED">ملغي (Cancelled)</option>
              </select>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-surface-200 mt-6">
              {selectedAppointment.status !== 'CANCELLED' ? (
                <button 
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) {
                      cancelMutation.mutate(selectedAppointment.id);
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  {cancelMutation.isPending ? 'جاري الإلغاء...' : 'إلغاء الموعد'}
                </button>
              ) : (
                <div />
              )}
              
              <div className="flex gap-3">
                <button onClick={() => { setShowEditModal(false); setSelectedAppointment(null); }} className="btn-secondary">
                  إغلاق
                </button>
                <button 
                  onClick={() => updateMutation.mutate({ id: selectedAppointment.id, status: selectedAppointment.status })} 
                  disabled={updateMutation.isPending} 
                  className="btn-primary"
                >
                  {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
