import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Clock } from 'lucide-react';
import api from '../../lib/api';

const DAYS_OF_WEEK = [
  { id: 0, name: 'الأحد' },
  { id: 1, name: 'الإثنين' },
  { id: 2, name: 'الثلاثاء' },
  { id: 3, name: 'الأربعاء' },
  { id: 4, name: 'الخميس' },
  { id: 5, name: 'الجمعة' },
  { id: 6, name: 'السبت' },
];

export default function DoctorScheduleSettings() {
  const queryClient = useQueryClient();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [sessionDuration, setSessionDuration] = useState<number>(30);
  const [allowOverbooking, setAllowOverbooking] = useState<boolean>(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  // Fetch doctors
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await api.get('/users/doctors');
      return res.data;
    },
  });

  // Fetch selected doctor's schedule
  const { data: scheduleData } = useQuery({
    queryKey: ['doctorSchedule', selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) return null;
      const res = await api.get(`/users/${selectedDoctorId}/schedule`);
      return res.data;
    },
    enabled: !!selectedDoctorId,
  });

  useEffect(() => {
    if (scheduleData) {
      setSessionDuration(scheduleData.sessionDuration ?? 30);
      setAllowOverbooking(scheduleData.allowOverbooking ?? false);
      
      const loadedSchedules = scheduleData.schedules || [];
      const newSchedules = DAYS_OF_WEEK.map((day) => {
        const existing = loadedSchedules.find((s: any) => s.dayOfWeek === day.id);
        return {
          dayOfWeek: day.id,
          isActive: existing ? existing.isActive : false,
          startTime: existing ? existing.startTime : '10:00',
          endTime: existing ? existing.endTime : '18:00',
        };
      });
      setSchedules(newSchedules);
    } else {
      setSchedules(DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day.id,
        isActive: false,
        startTime: '10:00',
        endTime: '18:00',
      })));
    }
  }, [scheduleData, selectedDoctorId]);

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.put(`/users/${selectedDoctorId}/schedule`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorSchedule', selectedDoctorId] });
      alert('تم حفظ الإعدادات بنجاح');
    },
    onError: () => {
      alert('حدث خطأ أثناء حفظ الإعدادات');
    },
  });

  const handleSave = () => {
    if (!selectedDoctorId) return;
    updateScheduleMutation.mutate({
      sessionDuration,
      allowOverbooking,
      schedules: schedules.filter(s => s.isActive),
    });
  };

  const updateDaySchedule = (dayId: number, field: string, value: any) => {
    setSchedules(prev => prev.map(s => 
      s.dayOfWeek === dayId ? { ...s, [field]: value } : s
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-rose-100 rounded-lg">
            <Clock className="w-5 h-5 text-rose-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">إدارة أوقات ومواعيد الأطباء</h2>
        </div>

        <div className="max-w-md mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">اختر الطبيب</label>
          <select
            className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
          >
            <option value="">-- يرجى اختيار الطبيب --</option>
            {doctors?.map((doc: any) => (
              <option key={doc.id} value={doc.id}>{doc.fullName}</option>
            ))}
          </select>
        </div>

        {selectedDoctorId && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مدة الجلسة الافتراضية (بالدقائق)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <div className="flex items-center h-full pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOverbooking}
                    onChange={(e) => setAllowOverbooking(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="block text-sm font-medium text-gray-900">السماح بالحجز الزائد (Overbooking)</span>
                    <span className="block text-xs text-gray-500">يتيح حجز موعد جديد في وقت محجوز مسبقاً</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Schedule Table */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">أوقات العمل الأسبوعية</h3>
              <div className="space-y-3">
                {schedules.map((schedule) => {
                  const dayName = DAYS_OF_WEEK.find(d => d.id === schedule.dayOfWeek)?.name;
                  return (
                    <div key={schedule.dayOfWeek} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-32 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={schedule.isActive}
                          onChange={(e) => updateDaySchedule(schedule.dayOfWeek, 'isActive', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{dayName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={schedule.startTime}
                          disabled={!schedule.isActive}
                          onChange={(e) => updateDaySchedule(schedule.dayOfWeek, 'startTime', e.target.value)}
                          className="rounded-lg border border-gray-300 p-2 text-sm disabled:opacity-50 disabled:bg-gray-100 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        />
                        <span className="text-gray-500">إلى</span>
                        <input
                          type="time"
                          value={schedule.endTime}
                          disabled={!schedule.isActive}
                          onChange={(e) => updateDaySchedule(schedule.dayOfWeek, 'endTime', e.target.value)}
                          className="rounded-lg border border-gray-300 p-2 text-sm disabled:opacity-50 disabled:bg-gray-100 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={updateScheduleMutation.isPending}
                className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-70"
              >
                <Save className="w-5 h-5" />
                {updateScheduleMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
