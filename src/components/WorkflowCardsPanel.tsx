import { useState, useEffect } from 'react';
import { Phone, Stethoscope, Clock, Activity, Loader, ChevronDown, ChevronUp, User } from 'lucide-react';

interface WorkflowCardProps {
  items: any[];
  isLoading: boolean;
  onCardClick: (item: any) => void;
  onCallClick?: (item: any) => void;
  onEndSession?: (item: any) => void;
  activeQueueId?: string | null;
}

const stageColors: Record<string, string> = {
  BOOKED: 'border-surface-200 bg-white',
  ARRIVED: 'border-yellow-300 bg-yellow-50',
  IN_PREP: 'border-orange-300 bg-orange-50',
  WAITING: 'border-red-300 bg-red-50',
  IN_SESSION: 'border-emerald-300 bg-emerald-50',
  PENDING_CHECKOUT: 'border-blue-300 bg-blue-50',
};

const stageTextColors: Record<string, string> = {
  BOOKED: 'text-surface-700',
  ARRIVED: 'text-yellow-700',
  IN_PREP: 'text-orange-700',
  WAITING: 'text-red-700',
  IN_SESSION: 'text-emerald-700',
  PENDING_CHECKOUT: 'text-blue-700',
};

const stageLabels: Record<string, string> = {
  BOOKED: 'محجوز',
  ARRIVED: 'حضر',
  IN_PREP: 'تجهيز',
  WAITING: 'انتظار',
  IN_SESSION: 'في الجلسة',
  PENDING_CHECKOUT: 'تسوية مالية',
};

function WaitingTime({ startTime }: { startTime: string | null }) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const update = () => {
      setMins(Math.floor((Date.now() - new Date(startTime).getTime()) / 60000));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [startTime]);
  if (!startTime || mins <= 0) return null;
  return <span>ينتظر منذ {mins} دقيقة</span>;
}

export default function WorkflowCardsPanel({ items, isLoading, onCardClick, onCallClick, onEndSession, activeQueueId }: WorkflowCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-surface-400 text-sm py-3">
        <Loader className="w-4 h-4 animate-spin" />
        <span>جاري تحميل المرضى...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 bg-surface-50 text-surface-500 text-sm">
        لا يوجد مرضى في الانتظار حالياً.
      </div>
    );
  }

  return (
    <div className="bg-white border border-surface-200 rounded-xl mb-6 shadow-sm overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          <span className="font-bold text-surface-900">طابور المرضى</span>
          <span className="mr-2 px-2 py-0.5 rounded-full bg-primary-100 text-xs font-bold text-primary-700">
            {items.length}
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-surface-500" /> : <ChevronDown className="w-5 h-5 text-surface-500" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-surface-200 bg-surface-50/50">
          <div className="flex flex-wrap gap-4 pb-2">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => onCardClick(item)}
                className={`flex-shrink-0 w-64 p-4 rounded-xl border-2 shadow-sm transition-all flex flex-col text-right cursor-pointer ${
                  stageColors[item.stage] || 'border-surface-200 bg-white'
                } ${activeQueueId === item.id ? 'ring-2 ring-primary-500 shadow-md' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-0">
                  <h4 className="font-bold text-surface-900 truncate pr-2">{item.client?.fullName || 'عميل غير محدد'}</h4>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md bg-white/50 ${stageTextColors[item.stage] || 'text-surface-700'}`}>
                    {stageLabels[item.stage] || item.stage}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 mb-3 mt-1">
                  <div className="flex items-center justify-between text-xs text-surface-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{item.client?.phone || 'لا يوجد هاتف'}</span>
                    </div>
                    {item.stage === 'WAITING' && item.queuePosition > 0 && (
                      <span className="text-sm font-black text-red-600 bg-white/80 px-2 py-0.5 rounded shadow-sm">
                        #{item.queuePosition}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-600">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span className="truncate font-medium">
                      {item.appointment?.appointmentServices?.map((as: any) => as.service?.name).join(' + ') || item.appointment?.service?.nameAr || item.appointment?.service?.name || 'بدون خدمة'}
                    </span>
                  </div>
                  {(item.stage === 'WAITING' || item.stage === 'IN_SESSION') && (
                    <div className="flex items-center gap-1.5 text-xs text-surface-600 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <WaitingTime startTime={item.waitingStartTime} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-black/5">
                  {item.stage === 'IN_SESSION' && onEndSession && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEndSession(item);
                      }}
                      className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                    >
                      إنهاء الزيارة
                    </button>
                  )}

                  {item.stage === 'WAITING' && onCallClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCallClick(item);
                      }}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all border shadow-sm ${
                        item.calledByDoctor 
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200' 
                          : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200'
                      }`}
                    >
                      {item.calledByDoctor ? 'إلغاء الاستدعاء' : 'استدعاء'}
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardClick(item);
                    }}
                    className="px-2 py-1 text-xs font-medium bg-white border border-surface-200 rounded hover:bg-surface-50 flex items-center"
                  >
                    <User className="w-3 h-3 ml-1" /> الملف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
