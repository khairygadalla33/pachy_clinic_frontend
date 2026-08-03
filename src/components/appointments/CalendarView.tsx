import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CalendarViewProps {
  appointments: any[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAppointmentClick: (apt: any) => void;
  onEmptyCellClick: (date: Date, time?: string) => void;
  timeframe: 'week' | 'month' | '6months' | 'year';
  maxSlotsPerDay?: number;
  appointmentInterval?: number;
  selectedDate?: Date;
  doctorSchedule?: any;
}

export default function CalendarView({ 
  appointments, currentDate, onDateChange, 
  onAppointmentClick, onEmptyCellClick, timeframe,
  maxSlotsPerDay = 8, appointmentInterval = 45,
  selectedDate, doctorSchedule
}: CalendarViewProps) {
  
  const { days, isWeekly } = useMemo(() => {
    const isWeekly = timeframe === 'week';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = [];

    if (isWeekly) {
      // Weekly view (7 days starting from current date)
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dayApts = appointments.filter(a => {
          const ad = new Date(a.scheduledDate);
          return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth() && ad.getDate() === d.getDate();
        });
        
        // Sort appointments by time
        dayApts.sort((a, b) => {
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return a.startTime.localeCompare(b.startTime);
        });

        days.push({ date: d, isCurrentMonth: true, appointments: dayApts });
      }
    } else {
      // Month view
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Padding for previous month
      for (let i = 0; i < firstDay; i++) {
        days.push({ date: null, isCurrentMonth: false, appointments: [] });
      }
      
      // Actual days
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dayApts = appointments.filter(a => {
          const ad = new Date(a.scheduledDate);
          return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth() && ad.getDate() === d.getDate();
        });
        days.push({ date: d, isCurrentMonth: true, appointments: dayApts });
      }
      
      // Padding for next month
      while (days.length % 7 !== 0) {
        days.push({ date: null, isCurrentMonth: false, appointments: [] });
      }
    }

    return {
      days,
      monthName: currentDate.toLocaleString('ar-EG', { month: 'long' }),
      year,
      isWeekly
    };
  }, [currentDate, appointments, timeframe]);



  const weekDaysMonthly = [
    { ar: 'الأحد' },
    { ar: 'الإثنين' },
    { ar: 'الثلاثاء' },
    { ar: 'الأربعاء' },
    { ar: 'الخميس' },
    { ar: 'الجمعة' },
    { ar: 'السبت' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'CONFIRMED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200';
      case 'COMPLETED': return 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-300 border-surface-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200';
      case 'OVERDUE': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200';
    }
  };

  return (
    <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Calendar Grid Header (Days of week) */}
      <div className="grid border-b border-surface-200 dark:border-surface-800 bg-surface-200 dark:bg-surface-700/50 grid-cols-7">
        {isWeekly ? days.map((dayColumn, idx) => {
          const date = dayColumn.date;
          if (!date) return null;
          const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div 
              key={idx} 
              onClick={() => onDateChange(date)}
              className={cn(
                "py-2 px-2 text-center border-r border-surface-200 dark:border-surface-800 last:border-r-0 cursor-pointer transition-all duration-200 min-h-[62px] flex flex-col justify-center",
                isToday ? "bg-primary-600 text-white shadow-lg z-10" : "hover:bg-surface-300 dark:hover:bg-surface-600"
              )}
            >
              <p className={cn(
                "text-[12px] font-black uppercase",
                isToday ? "text-white/90" : "text-primary-600 dark:text-primary-400"
              )}>
                {date.toLocaleDateString('ar-EG', { weekday: 'short' })}
              </p>
              <p className={cn(
                "text-sm font-normal tracking-tight",
                isToday ? "text-white" : "text-surface-900 dark:text-surface-100"
              )}>
                {date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
              </p>
              {isSelected && !isToday && (
                <div className="mx-auto mt-0.5 w-1 h-1 rounded-full bg-primary-600 animate-pulse" />
              )}
            </div>
          );
        }) : weekDaysMonthly.map((day, idx) => {
          return (
            <div 
              key={idx} 
              className="py-2 px-2 text-center border-r border-surface-200 dark:border-surface-800 last:border-r-0 min-h-[62px] flex flex-col justify-center bg-surface-200 dark:bg-surface-700/50"
            >
              <p className="text-[12px] font-black uppercase text-primary-600 dark:text-primary-400">
                {day.ar}
              </p>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid Body */}
      <div className="flex-1 overflow-y-auto">
        {isWeekly ? (
          <div className="grid grid-cols-7 relative">
            {/* Daily Columns */}
            {days.map((dayColumn, dayIdx) => {
              const dayOfWeek = dayColumn.date?.getDay();
              const scheduleForDay = doctorSchedule?.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);
              const isDoctorOff = doctorSchedule && (!scheduleForDay || !scheduleForDay.isActive);
              const allowOverbooking = doctorSchedule?.allowOverbooking ?? false;

              let startMinutes = 9 * 60; // default 9:00 AM
              let endMinutes = 17 * 60;  // default 5:00 PM
              
              if (scheduleForDay && scheduleForDay.isActive) {
                const [sh, sm] = scheduleForDay.startTime.split(':').map(Number);
                startMinutes = sh * 60 + sm;
                const [eh, em] = scheduleForDay.endTime.split(':').map(Number);
                endMinutes = eh * 60 + em;
              }

              const slotsToRender = doctorSchedule 
                ? Math.ceil((endMinutes - startMinutes) / appointmentInterval)
                : maxSlotsPerDay;

              return (
              <div 
                key={dayIdx} 
                className={cn(
                  "relative border-r border-surface-200 dark:border-surface-800 last:border-r-0 transition-colors flex flex-col",
                  dayColumn.date && dayColumn.date.toDateString() === new Date().toDateString() && "bg-primary-50/20 dark:bg-primary-900/10",
                  isDoctorOff && "bg-surface-100 dark:bg-surface-800 opacity-60"
                )}
              >
                {Array.from({ length: Math.max(slotsToRender, 1) }).map((_, slotIdx) => {
                  const slotMinutes = startMinutes + slotIdx * appointmentInterval;
                  const h = Math.floor(slotMinutes / 60);
                  const m = slotMinutes % 60;
                  const calculatedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                  
                  // Match appointments by time loosely (within this slot's interval)
                  const aptsInSlot = dayColumn.appointments.filter(a => {
                    if (!a.startTime) return false;
                    const [ah, am] = a.startTime.split(':').map(Number);
                    const aptMins = ah * 60 + am;
                    return aptMins >= slotMinutes && aptMins < slotMinutes + appointmentInterval;
                  });

                  const isOutsideHours = slotMinutes >= endMinutes;
                  const disabled = isDoctorOff || isOutsideHours;
                  const canBook = !disabled && (aptsInSlot.length === 0 || allowOverbooking);

                  return (
                    <div 
                      key={slotIdx} 
                      onClick={() => {
                        if (canBook && dayColumn.date) onEmptyCellClick(dayColumn.date, calculatedTime);
                      }}
                      className={cn(
                        "min-h-[4rem] border-b border-surface-100 dark:border-surface-800/50 p-1 group hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors relative flex flex-col gap-1",
                        canBook ? "cursor-pointer" : "cursor-not-allowed",
                        disabled && "bg-surface-50 dark:bg-surface-900/50"
                      )}
                    >
                      <div className="absolute top-1 left-1 opacity-40 text-[9px] font-bold text-surface-500 z-0">
                        {calculatedTime}
                      </div>

                      <div className="flex-1 flex flex-col gap-1 z-10 pt-3">
                        {aptsInSlot.map((apt: any) => (
                          <div 
                            key={apt.id}
                            onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }}
                            className={`p-1.5 rounded-md border text-xs shadow-sm hover:scale-[1.02] transition-transform cursor-pointer ${getStatusColor(apt.status)}`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                               <span className="font-bold text-[10px]">{apt.startTime}</span>
                               <span className="text-[8px] font-black uppercase opacity-60 tracking-widest">{apt.status}</span>
                            </div>
                            <p className="font-medium truncate text-[10px]">{apt.client?.fullName}</p>
                          </div>
                        ))}

                        {canBook && (
                          <div className={cn(
                            "flex items-center justify-center rounded-md border border-dashed border-primary-300 text-primary-500 hover:bg-primary-50 hover:border-primary-400 transition-colors py-1 text-[10px] font-bold mt-auto",
                            aptsInSlot.length > 0 ? "opacity-0 group-hover:opacity-100 h-6" : "h-full opacity-0 group-hover:opacity-100"
                          )}>
                             + موعد
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )})}
          </div>
        ) : (
          <div className="grid min-h-full grid-cols-7 auto-rows-fr">
            {days.map((cell, idx) => {
              const isFullyBooked = cell.appointments.filter((a: any) => a.status !== 'CANCELLED').length >= maxSlotsPerDay;
              
              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (cell.date) onEmptyCellClick(cell.date);
                  }}
                  className={`flex flex-col p-2 border-b border-r border-surface-200 dark:border-surface-800 transition-colors relative group
                    ${!cell.isCurrentMonth ? 'bg-surface-50 dark:bg-surface-950/50 text-surface-400' : 'hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer'} 
                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                    min-h-[90px]
                  `}
                >
                  {cell.date && (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        {isFullyBooked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" /> Full
                          </span>
                        )}
                        <div className={`text-sm font-medium ml-auto w-7 h-7 flex items-center justify-center rounded-full ${
                          cell.date.toDateString() === new Date().toDateString() 
                            ? 'bg-primary-600 text-white' 
                            : 'text-surface-600 dark:text-surface-300 group-hover:bg-surface-200 dark:group-hover:bg-surface-700'
                        }`}>
                          {cell.date.getDate()}
                        </div>
                      </div>
                      
                      <div className="space-y-1 flex-1 p-0.5 overflow-hidden">
                        {cell.appointments.map((apt: any) => (
                          <div 
                            key={apt.id} 
                            onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }}
                            className={`text-[10px] px-1.5 py-1 rounded border leading-tight hover:opacity-80 transition-opacity truncate flex justify-between gap-1 ${getStatusColor(apt.status)}`}
                            title={`${apt.startTime || ''} - ${apt.client?.fullName}`}
                          >
                            <span className="font-bold shrink-0">{apt.startTime || 'TBD'}</span>
                            <span className="truncate">{apt.client?.fullName}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
