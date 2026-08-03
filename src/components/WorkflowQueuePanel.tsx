import { useState, useEffect } from 'react';
import { User, Stethoscope, ChevronDown, ChevronUp, Clock, Phone } from 'lucide-react';
import Badge from './Badge';

interface WorkflowQueuePanelProps {
  doctorGroups: Array<{
    doctor: { id: string; fullName: string };
    items: Array<any>;
  }>;
  onAction: (itemId: string, action: string) => void;
  onViewClient: (clientId: string) => void;
  onCheckout?: (item: any) => void;
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
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;
  return <span className="font-bold">{mins} دقيقة</span>;
}

export default function WorkflowQueuePanel({ doctorGroups, onAction, onViewClient, onCheckout }: WorkflowQueuePanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (docId: string) => {
    setOpenSections(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  if (!doctorGroups || doctorGroups.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 text-surface-400 text-sm">
        لا يوجد مرضى في قائمة الانتظار اليوم.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {doctorGroups.map((group, idx) => {
        const docId = group.doctor?.id || `unassigned-${idx}`;
        const docName = group.doctor?.fullName ? `د. ${group.doctor.fullName}` : 'طبيب غير محدد';
        const isOpen = openSections[docId] !== false; // default true
        return (
          <div key={docId} className="bg-white border border-surface-200 rounded-xl overflow-hidden shadow-sm">
            <button 
              onClick={() => toggleSection(docId)}
              className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-surface-900">{docName}</span>
                <Badge variant="info">{group.items.length} مرضى</Badge>
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5 text-surface-500" /> : <ChevronDown className="w-5 h-5 text-surface-500" />}
            </button>

            {isOpen && (
              <div className="p-4 bg-surface-50/50">
                <div className="flex flex-wrap gap-4">
                  {group.items.length === 0 ? (
                    <p className="text-sm text-surface-400">قائمة الانتظار فارغة.</p>
                  ) : (
                    group.items.map((item) => (
                      <div 
                        key={item.id} 
                        className={`flex-shrink-0 w-64 p-4 rounded-xl border-2 shadow-sm transition-all ${stageColors[item.stage]}`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-surface-900 truncate pr-2">{item.client?.fullName}</h4>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md bg-white/50 ${stageTextColors[item.stage]}`}>
                            {stageLabels[item.stage]}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-1.5 text-xs text-surface-600">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{item.client?.phone || 'لا يوجد هاتف'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-surface-600">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span className="truncate font-medium">
                              {item.appointment?.appointmentServices?.map((as: any) => as.service?.name).join(' + ') || 'بدون خدمة'}
                            </span>
                          </div>
                          {(item.stage === 'WAITING' || item.stage === 'IN_SESSION') && (
                            <div className="flex items-center gap-1.5 text-xs text-surface-600 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <WaitingTime startTime={item.waitingStartTime} />
                              {item.stage === 'WAITING' && item.queuePosition > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-white text-red-600 border border-red-200">
                                  #{item.queuePosition}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-black/5">
                          {item.stage === 'BOOKED' && (
                            <>
                              <button onClick={() => onAction(item.id, 'check-in')} className="px-2 py-1 text-xs font-medium bg-white border border-surface-200 rounded hover:bg-surface-50">تسجيل وصول</button>
                              <button onClick={() => onAction(item.id, 'no-show')} className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100">لم يحضر</button>
                            </>
                          )}
                          {item.stage === 'ARRIVED' && (
                            <button onClick={() => onAction(item.id, 'ready')} className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600">انتظار (جاهز)</button>
                          )}
                          {item.stage === 'WAITING' && (
                            <button onClick={() => onAction(item.id, 'start-session')} className="px-2 py-1 text-xs font-medium bg-emerald-500 text-white rounded hover:bg-emerald-600">بدء الجلسة</button>
                          )}
                          {item.stage === 'IN_SESSION' && (
                            <button onClick={() => onAction(item.id, 'end-session')} className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600">إنهاء الجلسة</button>
                          )}
                          {item.stage === 'PENDING_CHECKOUT' && onCheckout && (
                            <button onClick={() => onCheckout(item)} className="px-2 py-1 text-xs font-medium bg-surface-900 text-white rounded hover:bg-black">الدفع</button>
                          )}

                          <button onClick={() => onViewClient(item.clientId)} className="px-2 py-1 text-xs font-medium bg-white border border-surface-200 rounded hover:bg-surface-50 flex items-center">
                            <User className="w-3 h-3 ml-1" /> الملف
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
