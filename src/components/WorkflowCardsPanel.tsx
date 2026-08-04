import { useState, useEffect } from 'react';
import { User, Activity, Clock, Loader, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkflowCardProps {
  items: any[];
  isLoading: boolean;
  onCardClick: (item: any) => void;
  activeQueueId?: string | null;
}

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

export default function WorkflowCardsPanel({ items, isLoading, onCardClick, activeQueueId }: WorkflowCardProps) {
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
          <Activity className="w-5 h-5 text-primary-500" />
          <span className="font-bold text-surface-900">المرضى في الانتظار</span>
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
              <button
                key={item.id}
                onClick={() => onCardClick(item)}
                className={`flex-shrink-0 w-64 text-right group relative overflow-hidden bg-white border ${activeQueueId === item.id ? 'border-primary-500 shadow-md ring-1 ring-primary-500/20' : 'border-surface-200 hover:border-primary-300'} p-4 rounded-xl shadow-sm hover:shadow-md transition-all h-full`}
              >
                {/* Active Indicator line */}
                {activeQueueId === item.id && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-xl" />
                )}
                
                {/* Patient Name + Status */}
                <div className="flex items-start justify-between gap-1 mb-3">
                  <span className="font-bold text-sm text-surface-900 leading-tight">
                    {item.client?.fullName || 'عميل غير محدد'}
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.stage === 'IN_SESSION' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {item.stage === 'IN_SESSION' ? 'في الجلسة' : 'في الانتظار'}
                    </span>
                    {item.stage === 'WAITING' && item.queuePosition > 0 && (
                      <span className="text-lg mt-1 font-black text-red-600 bg-red-50 px-2.5 py-0.5 rounded-lg shadow-sm border border-red-100">
                        #{item.queuePosition}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Service */}
                <div className="flex items-center gap-2 text-xs text-surface-600 mb-2">
                  <Activity className="w-3.5 h-3.5 flex-shrink-0 text-primary-500" />
                  <span className="font-medium truncate">{item.appointment?.service?.nameAr || item.appointment?.service?.name}</span>
                </div>
                
                {/* Phone */}
                {item.client?.phone && (
                  <div className="flex items-center gap-2 text-xs text-surface-500 mb-2">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-mono">{item.client.phone}</span>
                  </div>
                )}
                
                {/* Time */}
                <div className="flex items-center gap-2 text-xs text-surface-500">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 text-surface-400" />
                  <span>
                    {item.stage === 'IN_SESSION' 
                      ? 'الجلسة جارية الآن' 
                      : <WaitingTime startTime={item.waitingStartTime} />
                    }
                    {!item.waitingStartTime && item.stage !== 'IN_SESSION' && 'وصل للتو'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
