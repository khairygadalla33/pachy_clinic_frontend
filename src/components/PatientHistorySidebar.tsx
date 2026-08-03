import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PatientHistorySidebarProps {
  clientId: string;
  excludeAppointmentId?: string;
}

export default function PatientHistorySidebar({ clientId, excludeAppointmentId }: PatientHistorySidebarProps) {
  const { data: historyItems, isLoading } = useQuery({
    queryKey: ['patientHistory', clientId, excludeAppointmentId],
    queryFn: async () => {
      const url = excludeAppointmentId 
        ? `/workflow/patient-history/${clientId}?exclude=${excludeAppointmentId}`
        : `/workflow/patient-history/${clientId}`;
      const res = await api.get(url);
      return res.data;
    },
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-surface-50 border-l border-surface-200">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-surface-500 mt-2 text-sm">جاري تحميل التاريخ المرضي...</p>
      </div>
    );
  }

  if (!historyItems || historyItems.length === 0) {
    return (
      <div className="w-80 flex-shrink-0 flex flex-col h-full bg-surface-50 border-l border-surface-200 p-6 overflow-y-auto">
        <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          التاريخ المرضي والزيارات
        </h3>
        <div className="text-center text-surface-500 mt-10">
          لا توجد زيارات سابقة لهذا المريض.
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full bg-surface-50 border-l border-surface-200 p-6 overflow-y-auto custom-scrollbar">
      <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2 sticky top-0 bg-surface-50 py-2 z-10">
        <Calendar className="w-5 h-5 text-primary-500" />
        التاريخ المرضي والزيارات
      </h3>

      <div className="space-y-6">
        {historyItems.map((item: any) => {
          const serviceName = item.appointment?.service?.nameAr || item.appointment?.service?.name || 'جلسة';
          
          return (
            <div key={item.id} className="relative pl-4 border-r-2 border-primary-200 pb-2">
              <div className="absolute -right-[9px] top-1 w-4 h-4 rounded-full bg-primary-100 border-2 border-primary-500" />
              
              <div className="mb-1 font-bold text-primary-700 text-sm">
                {format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: ar })}:
              </div>
              <div className="font-semibold text-surface-900 mb-2">
                {serviceName}
              </div>

              {/* Laser details */}
              {item.laserSession && (
                <div className="text-xs text-surface-600 bg-white p-2 rounded border border-surface-200 mb-2 space-y-1">
                  <div>
                    <span className="font-medium text-surface-800">energy:</span> {item.laserSession.energyLevel} {' '}
                    <span className="font-medium text-surface-800">pulse:</span> {item.laserSession.pulseWidth} {' '}
                    <span className="font-medium text-surface-800">spot size:</span> {item.laserSession.spotSize}
                  </div>
                  <div>
                    <span className="font-medium text-surface-800">reaction:</span> {item.laserSession.skinReaction}
                  </div>
                  {item.laserSession.notes && (
                    <div className="text-surface-500 italic">notes: {item.laserSession.notes}</div>
                  )}
                </div>
              )}

              {/* Injection details */}
              {item.injectionSession && (
                <div className="text-xs text-surface-600 bg-white p-2 rounded border border-surface-200 mb-2 space-y-1">
                  <div>
                    <span className="font-medium text-surface-800">product:</span> {item.injectionSession.productUsed} ({item.injectionSession.quantityUsed} {item.injectionSession.quantityUnit})
                  </div>
                  <div>
                    <span className="font-medium text-surface-800">area:</span> {item.injectionSession.areaInjected}
                  </div>
                  {item.injectionSession.notes && (
                    <div className="text-surface-500 italic">notes: {item.injectionSession.notes}</div>
                  )}
                </div>
              )}

              {/* Skin Care details */}
              {item.skinCareSession && (
                <div className="text-xs text-surface-600 bg-white p-2 rounded border border-surface-200 mb-2 space-y-1">
                  <div>
                    <span className="font-medium text-surface-800">procedure:</span> {item.skinCareSession.procedureName}
                  </div>
                  {item.skinCareSession.notes && (
                    <div className="text-surface-500 italic">notes: {item.skinCareSession.notes}</div>
                  )}
                </div>
              )}

              {/* Prescriptions */}
              {item.prescription && item.prescription.items && item.prescription.items.length > 0 && (
                <div className="text-xs mt-2">
                  <div className="font-medium text-surface-800 mb-1">prescriptions:</div>
                  <ul className="list-disc list-inside text-surface-600 space-y-0.5">
                    {item.prescription.items.map((p: any) => (
                      <li key={p.id}>
                        {p.medicationName}, {p.dose}, {p.frequency}, {p.duration}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
