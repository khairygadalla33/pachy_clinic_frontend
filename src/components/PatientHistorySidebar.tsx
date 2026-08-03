import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { 
  Calendar, 
  Loader2, 
  AlertTriangle, 
  HeartPulse, 
  Pill, 
  Sparkles, 
  Syringe, 
  Zap, 
  FileText, 
  Search,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  User,
  Info,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Badge from './Badge';

interface PatientHistorySidebarProps {
  clientId: string;
  excludeAppointmentId?: string;
}

export default function PatientHistorySidebar({ clientId, excludeAppointmentId }: PatientHistorySidebarProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'LASER' | 'INJECTION' | 'SKIN_CARE' | 'PRESCRIPTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
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

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="w-[380px] flex-shrink-0 flex flex-col items-center justify-center h-full bg-surface-50 border-l border-surface-200 p-6">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-surface-500 mt-2 text-sm">جاري تحميل السجل الطبي الكامل للمريض...</p>
      </div>
    );
  }

  const client = data?.client;
  // Support both new object structure and fallback array
  const rawTimeline = Array.isArray(data) ? data : (data?.timeline || []);
  // All prescriptions for matching with visits
  const allPrescriptions: any[] = data?.prescriptions || [];

  // Build a map: appointmentId -> prescriptions for that appointment
  const prescriptionsByAppointment: Record<string, any[]> = {};
  for (const p of allPrescriptions) {
    if (p.appointmentId) {
      if (!prescriptionsByAppointment[p.appointmentId]) {
        prescriptionsByAppointment[p.appointmentId] = [];
      }
      prescriptionsByAppointment[p.appointmentId].push(p);
    }
  }

  // Filter timeline
  const filteredTimeline = rawTimeline.filter((item: any) => {
    // Type filter
    if (filterType !== 'ALL') {
      const itemType = item.type || (item.laserSession ? 'LASER' : item.injectionSession ? 'INJECTION' : item.skinCareSession ? 'SKIN_CARE' : item.prescription ? 'PRESCRIPTION' : 'ALL');
      if (itemType !== filterType) return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const serviceName = (item.serviceName || item.appointment?.service?.nameAr || item.appointment?.service?.name || '').toLowerCase();
      const notes = (item.laserSession?.notes || item.injectionSession?.notes || item.skinCareSession?.notes || '').toLowerCase();
      const doctor = (item.doctor || item.performedBy?.fullName || '').toLowerCase();
      return serviceName.includes(q) || notes.includes(q) || doctor.includes(q);
    }
    return true;
  });

  const hasAllergies = !!client?.allergies && client.allergies.trim() !== '';
  const hasMedicalConditions = !!client?.medicalConditions && client.medicalConditions.trim() !== '';
  const hasCurrentMedications = !!client?.currentMedications && client.currentMedications.trim() !== '';
  const isPregnantOrNursing = client?.isPregnant || client?.isBreastfeeding;

  // Helper to render medications for a session
  const renderMedicationsForAppointment = (appointmentId?: string) => {
    if (!appointmentId) return null;
    const prescriptions = prescriptionsByAppointment[appointmentId];
    
    if (!prescriptions || prescriptions.length === 0) {
      return (
        <div className="flex items-center gap-1.5 p-2 bg-surface-50 rounded border border-surface-100 text-xs text-surface-400 italic">
          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
          لم يتم التوصية بأي أدوية في هذه الجلسة
        </div>
      );
    }

    return prescriptions.map((prescription: any) => (
      <div key={prescription.id} className="bg-blue-50/50 p-2.5 rounded border border-blue-100 space-y-1.5">
        <h5 className="font-bold text-blue-900 text-[11px] flex items-center gap-1">
          <Pill className="w-3.5 h-3.5" /> الأدوية الموصوفة:
        </h5>
        {prescription.items && prescription.items.length > 0 ? (
          <div className="space-y-1">
            {prescription.items.map((med: any, mIdx: number) => (
              <div key={med.id || mIdx} className="bg-white p-1.5 rounded border border-blue-100/70 text-xs">
                <div className="font-bold text-surface-900 flex justify-between">
                  <span>{med.medicationName}</span>
                  {med.dose && <span className="text-blue-700 font-semibold">{med.dose}</span>}
                </div>
                <div className="text-[11px] text-surface-600 mt-0.5 flex flex-wrap gap-2">
                  {med.frequency && <span>التكرار: {med.frequency}</span>}
                  {med.duration && <span>المدة: {med.duration}</span>}
                </div>
                {med.notes && (
                  <p className="text-[11px] text-surface-500 italic mt-0.5">{med.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-surface-400 italic">لا توجد أدوية محددة</p>
        )}
        {prescription.instructions && (
          <div className="p-1.5 bg-white/70 rounded text-[11px] text-surface-700 mt-1">
            <span className="font-bold text-surface-800">تعليمات:</span> {prescription.instructions}
          </div>
        )}
      </div>
    ));
  };

  // Helper: Skin reaction display
  const getSkinReactionDisplay = (reaction: string) => {
    switch (reaction) {
      case 'NONE': return { label: 'طبيعي (None)', cls: 'bg-green-100 text-green-800' };
      case 'MILD': return { label: 'بسيط (Mild)', cls: 'bg-blue-100 text-blue-800' };
      case 'MODERATE': return { label: 'متوسط (Moderate)', cls: 'bg-yellow-100 text-yellow-800' };
      case 'SEVERE': return { label: 'شديد (Severe)', cls: 'bg-red-100 text-red-800' };
      default: return { label: reaction || 'عادي', cls: 'bg-surface-100 text-surface-700' };
    }
  };

  return (
    <div className="w-[450px] flex-shrink-0 flex flex-col h-full bg-surface-50 border-l border-surface-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-surface-200 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-surface-900 flex items-center gap-2 text-base">
            <User className="w-5 h-5 text-primary-600" />
            الملف الطبي والتاريخ المرضي
          </h3>
          <Badge variant="info">
            {client?.totalVisits || 0} زيارة سابقة
          </Badge>
        </div>

        {/* Client quick info */}
        {client && (
          <div className="text-xs text-surface-600 flex flex-wrap gap-2 mb-2">
            <span className="font-medium text-surface-900">{client.fullName}</span>
            {client.phone && <span>• {client.phone}</span>}
            {client.skinType && (
              <span className="bg-surface-100 px-1.5 py-0.5 rounded text-surface-700 font-medium">
                بشرة: {client.skinType}
              </span>
            )}
          </div>
        )}

        {/* Critical Medical Alerts */}
        {(hasAllergies || isPregnantOrNursing || hasMedicalConditions || hasCurrentMedications) && (
          <div className="space-y-1.5 mt-2">
            {/* Allergies Warning */}
            {hasAllergies && (
              <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs font-semibold animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">حساسية دوائية/جلدية:</span> {client.allergies}
                </div>
              </div>
            )}

            {/* Pregnancy / Nursing */}
            {isPregnantOrNursing && (
              <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  {client.isPregnant && '• المريضة حامل '}
                  {client.isBreastfeeding && '• المريضة ترضع '}
                  (يرجى مراعاة الأدوية والإجراءات المناسبة)
                </div>
              </div>
            )}

            {/* Chronic Conditions */}
            {hasMedicalConditions && (
              <div className="flex items-start gap-1.5 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
                <HeartPulse className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">أمراض مزمنة:</span> {client.medicalConditions}
                </div>
              </div>
            )}

            {/* Current Medications */}
            {hasCurrentMedications && (
              <div className="flex items-start gap-1.5 p-2 bg-purple-50 border border-purple-200 rounded text-purple-800 text-xs">
                <Pill className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">أدوية حالية:</span> {client.currentMedications}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Client Medical Notes */}
        {client?.medicalNotes && (
          <div className="mt-2 p-2 bg-amber-50/60 border border-amber-200/60 rounded text-xs text-amber-900">
            <span className="font-semibold flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-700" /> ملاحظات طبية دائمة:
            </span>
            <p className="mt-0.5 text-surface-700">{client.medicalNotes}</p>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-surface-100 border-b border-surface-200 flex-shrink-0 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-surface-400" />
          <input
            type="text"
            placeholder="بحث في الجلسات والملاحظات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-surface-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex gap-1 overflow-x-auto pb-1 text-xs custom-scrollbar">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              filterType === 'ALL'
                ? 'bg-primary-600 text-white font-bold'
                : 'bg-white text-surface-600 hover:bg-surface-200'
            }`}
          >
            الكل ({rawTimeline.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('LASER')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'LASER'
                ? 'bg-red-600 text-white font-bold'
                : 'bg-white text-surface-600 hover:bg-surface-200'
            }`}
          >
            <Zap className="w-3 h-3" /> ليزر
          </button>
          <button
            type="button"
            onClick={() => setFilterType('INJECTION')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'INJECTION'
                ? 'bg-teal-600 text-white font-bold'
                : 'bg-white text-surface-600 hover:bg-surface-200'
            }`}
          >
            <Syringe className="w-3 h-3" /> حقن
          </button>
          <button
            type="button"
            onClick={() => setFilterType('SKIN_CARE')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'SKIN_CARE'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-white text-surface-600 hover:bg-surface-200'
            }`}
          >
            <Sparkles className="w-3 h-3" /> بشرة
          </button>
          <button
            type="button"
            onClick={() => setFilterType('PRESCRIPTION')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'PRESCRIPTION'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-white text-surface-600 hover:bg-surface-200'
            }`}
          >
            <FileText className="w-3 h-3" /> روشتات
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-12 text-surface-400 text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            لا توجد سجلات مطابقة في التاريخ المرضي
          </div>
        ) : (
          filteredTimeline.map((item: any, idx: number) => {
            const isExpanded = expandedItems[item.id] !== false; // Default expanded
            const dateStr = item.date || item.createdAt;
            const formattedDate = dateStr
              ? format(new Date(dateStr), 'dd/MM/yyyy - hh:mm a', { locale: ar })
              : 'تاريخ غير محدد';

            const laser = item.laserSession;
            const injection = item.injectionSession;
            const skinCare = item.skinCareSession;
            const prescription = item.prescription;

            // Get the appointmentId for this session to look up medications
            const sessionAppointmentId = laser?.appointmentId || injection?.appointmentId || skinCare?.appointmentId;

            // Determine item badge styling
            let itemType = item.type;
            if (!itemType) {
              if (laser) itemType = 'LASER';
              else if (injection) itemType = 'INJECTION';
              else if (skinCare) itemType = 'SKIN_CARE';
              else if (prescription) itemType = 'PRESCRIPTION';
              else itemType = 'VISIT';
            }

            return (
              <div
                key={item.id || idx}
                className="bg-white rounded-lg border border-surface-200 shadow-sm overflow-hidden transition-all hover:border-primary-300"
              >
                {/* Card Header */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-3 bg-surface-50/80 border-b border-surface-100 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    {itemType === 'LASER' && (
                      <span className="p-1 rounded bg-red-100 text-red-700">
                        <Zap className="w-4 h-4" />
                      </span>
                    )}
                    {itemType === 'INJECTION' && (
                      <span className="p-1 rounded bg-teal-100 text-teal-700">
                        <Syringe className="w-4 h-4" />
                      </span>
                    )}
                    {itemType === 'SKIN_CARE' && (
                      <span className="p-1 rounded bg-purple-100 text-purple-700">
                        <Sparkles className="w-4 h-4" />
                      </span>
                    )}
                    {itemType === 'PRESCRIPTION' && (
                      <span className="p-1 rounded bg-blue-100 text-blue-700">
                        <FileText className="w-4 h-4" />
                      </span>
                    )}
                    <div>
                      <h4 className="font-bold text-surface-900 text-xs">
                        {item.serviceName || item.appointment?.service?.nameAr || 'جلسة عيادة'}
                      </h4>
                      <p className="text-[11px] text-surface-500">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.doctor && (
                      <span className="text-[10px] text-surface-600 bg-surface-200/70 px-1.5 py-0.5 rounded">
                        د/ {item.doctor}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-surface-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-surface-400" />
                    )}
                  </div>
                </div>

                {/* Card Body */}
                {isExpanded && (
                  <div className="p-3 text-xs space-y-2.5">
                    {/* Laser Details */}
                    {laser && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 bg-red-50/40 p-2 rounded border border-red-100">
                          <div>
                            <span className="text-surface-500 font-medium">رقم الجلسة:</span>{' '}
                            <span className="font-bold text-surface-900">
                              {laser.sessionNumber || 1} {laser.totalPlanned ? `من ${laser.totalPlanned}` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-surface-500 font-medium">عدد النبضات:</span>{' '}
                            <span className="font-bold text-red-700">{laser.numberOfPulses || '-'}</span>
                          </div>
                          <div>
                            <span className="text-surface-500 font-medium">Energy (J/cm²):</span>{' '}
                            <span className="font-semibold">{laser.energyLevel ?? '-'}</span>
                          </div>
                          <div>
                            <span className="text-surface-500 font-medium">Spot Size:</span>{' '}
                            <span className="font-semibold">{laser.spotSize ? `${laser.spotSize} mm` : '-'}</span>
                          </div>
                          <div>
                            <span className="text-surface-500 font-medium">Pulse Width:</span>{' '}
                            <span className="font-semibold">{laser.pulseWidth ? `${laser.pulseWidth} ms` : '-'}</span>
                          </div>
                          <div>
                            <span className="text-surface-500 font-medium">طريقة التبريد:</span>{' '}
                            <span className="font-semibold">{laser.coolingMethod || '-'}</span>
                          </div>
                        </div>

                        {laser.device && (
                          <div className="text-surface-600 bg-surface-100/70 px-2 py-1 rounded flex justify-between items-center">
                            <span className="font-medium text-surface-700">الجهاز المستخدم:</span>
                            <span className="font-bold text-primary-700">{laser.device.name} {laser.device.model ? `(${laser.device.model})` : ''}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-surface-600 font-medium">رد فعل الجلد:</span>
                          {(() => {
                            const rd = getSkinReactionDisplay(laser.skinReaction);
                            return (
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${rd.cls}`}>
                                {rd.label}
                              </span>
                            );
                          })()}
                        </div>

                        {laser.nextSessionDate && (
                          <div className="text-primary-700 bg-primary-50 p-1.5 rounded border border-primary-200 text-[11px]">
                            <span className="font-bold">موعد الجلسة القادمة المقترح:</span>{' '}
                            {format(new Date(laser.nextSessionDate), 'dd/MM/yyyy', { locale: ar })}
                          </div>
                        )}

                        {laser.notes && (
                          <div className="p-2 bg-surface-100 rounded text-surface-700">
                            <span className="font-bold text-surface-900 block mb-0.5">ملاحظات الطبيب:</span>
                            {laser.notes}
                          </div>
                        )}

                        {/* Photos if any */}
                        {(laser.photoBeforeUrl || laser.photoDuringUrl || laser.photoAfterUrl) && (
                          <div className="flex gap-2 pt-1">
                            {laser.photoBeforeUrl && (
                              <a href={laser.photoBeforeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-primary-600 hover:underline bg-surface-100 px-2 py-1 rounded">
                                <ImageIcon className="w-3 h-3" /> قبل
                              </a>
                            )}
                            {laser.photoDuringUrl && (
                              <a href={laser.photoDuringUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-primary-600 hover:underline bg-surface-100 px-2 py-1 rounded">
                                <ImageIcon className="w-3 h-3" /> أثناء
                              </a>
                            )}
                            {laser.photoAfterUrl && (
                              <a href={laser.photoAfterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-primary-600 hover:underline bg-surface-100 px-2 py-1 rounded">
                                <ImageIcon className="w-3 h-3" /> بعد
                              </a>
                            )}
                          </div>
                        )}

                        {/* Medications for this visit */}
                        {renderMedicationsForAppointment(sessionAppointmentId)}
                      </div>
                    )}

                    {/* Injection Details */}
                    {injection && (
                      <div className="space-y-2">
                        <div className="bg-teal-50/50 p-2.5 rounded border border-teal-100 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-surface-500 font-medium">المنتج المستخدم:</span>
                            <span className="font-bold text-teal-900">{injection.productUsed}</span>
                          </div>
                          {injection.productBatch && (
                            <div className="flex justify-between">
                              <span className="text-surface-500 font-medium">رقم التشغيلة (Batch):</span>
                              <span className="font-semibold text-surface-800">{injection.productBatch}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-surface-500 font-medium">منطقة الحقن:</span>
                            <span className="font-bold text-surface-900">{injection.areaInjected}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-surface-500 font-medium">الكمية:</span>
                            <span className="font-bold text-teal-800">{injection.quantityUsed} {injection.quantityUnit || 'ml'}</span>
                          </div>
                          {injection.techniqueUsed && (
                            <div className="flex justify-between">
                              <span className="text-surface-500 font-medium">التقنية:</span>
                              <span className="font-semibold text-surface-800">{injection.techniqueUsed}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-surface-500 font-medium">استخدام تخدير:</span>
                            <span className="font-semibold text-surface-800">{injection.anesthesiaUsed ? 'نعم (بنج موضعي)' : 'لا'}</span>
                          </div>
                        </div>

                        {injection.followUpDate && (
                          <div className="text-teal-800 bg-teal-50 p-1.5 rounded border border-teal-200 text-[11px]">
                            <span className="font-bold">موعد المتابعة:</span>{' '}
                            {format(new Date(injection.followUpDate), 'dd/MM/yyyy', { locale: ar })}
                          </div>
                        )}

                        {injection.notes && (
                          <div className="p-2 bg-surface-100 rounded text-surface-700">
                            <span className="font-bold text-surface-900 block mb-0.5">ملاحظات الطبيب:</span>
                            {injection.notes}
                          </div>
                        )}

                        {/* Photos */}
                        {(injection.photoBeforeUrl || injection.photoAfterUrl) && (
                          <div className="flex gap-2 pt-1">
                            {injection.photoBeforeUrl && (
                              <a href={injection.photoBeforeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-teal-700 hover:underline bg-surface-100 px-2 py-1 rounded">
                                <ImageIcon className="w-3 h-3" /> قبل الحقن
                              </a>
                            )}
                            {injection.photoAfterUrl && (
                              <a href={injection.photoAfterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-teal-700 hover:underline bg-surface-100 px-2 py-1 rounded">
                                <ImageIcon className="w-3 h-3" /> بعد الحقن
                              </a>
                            )}
                          </div>
                        )}

                        {/* Medications for this visit */}
                        {renderMedicationsForAppointment(sessionAppointmentId)}
                      </div>
                    )}

                    {/* Skin Care Details */}
                    {skinCare && (
                      <div className="space-y-2">
                        <div className="bg-purple-50/50 p-2.5 rounded border border-purple-100 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-surface-500 font-medium">اسم الإجراء:</span>
                            <span className="font-bold text-purple-900">{skinCare.procedureName}</span>
                          </div>
                          {skinCare.productsUsed && (
                            <div className="mt-1">
                              <span className="text-surface-500 font-medium block">المواد والسيرومات:</span>
                              <div className="font-semibold text-surface-800 bg-white/70 p-1.5 rounded mt-0.5">
                                {typeof skinCare.productsUsed === 'string' 
                                  ? skinCare.productsUsed 
                                  : JSON.stringify(skinCare.productsUsed)}
                              </div>
                            </div>
                          )}
                        </div>

                        {skinCare.followUpDate && (
                          <div className="text-purple-800 bg-purple-50 p-1.5 rounded border border-purple-200 text-[11px]">
                            <span className="font-bold">موعد الجلسة التالية:</span>{' '}
                            {format(new Date(skinCare.followUpDate), 'dd/MM/yyyy', { locale: ar })}
                          </div>
                        )}

                        {skinCare.notes && (
                          <div className="p-2 bg-surface-100 rounded text-surface-700">
                            <span className="font-bold text-surface-900 block mb-0.5">ملاحظات الطبيب:</span>
                            {skinCare.notes}
                          </div>
                        )}

                        {/* Photos */}
                        {(skinCare.photoBeforeUrl || skinCare.photoAfterUrl) && (
                          <div className="flex gap-2 pt-1">
                            {skinCare.photoBeforeUrl && (
                              <a href={skinCare.photoBeforeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-purple-700 hover:underline bg-surface-100 px-2 py-1 rounded">
                                <ImageIcon className="w-3 h-3" /> قبل
                              </a>
                            )}
                            {skinCare.photoAfterUrl && (
                              <a href={skinCare.photoAfterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-purple-700 hover:underline bg-surface-100 px-2 py-1 rounded">
                                <ImageIcon className="w-3 h-3" /> بعد
                              </a>
                            )}
                          </div>
                        )}

                        {/* Medications for this visit */}
                        {renderMedicationsForAppointment(sessionAppointmentId)}
                      </div>
                    )}

                    {/* Prescription Details (standalone prescription, not linked to session) */}
                    {prescription && (
                      <div className="space-y-2">
                        {prescription.items && prescription.items.length > 0 && (
                          <div className="bg-blue-50/50 p-2.5 rounded border border-blue-100">
                            <h5 className="font-bold text-blue-900 mb-1.5 flex items-center gap-1">
                              <Pill className="w-3.5 h-3.5" /> الأدوية الموصوفة:
                            </h5>
                            <div className="space-y-1.5">
                              {prescription.items.map((med: any, mIdx: number) => (
                                <div key={med.id || mIdx} className="bg-white p-2 rounded border border-blue-100/70 text-xs">
                                  <div className="font-bold text-surface-900 flex justify-between">
                                    <span>{med.medicationName}</span>
                                    {med.dose && <span className="text-blue-700 font-semibold">{med.dose}</span>}
                                  </div>
                                  <div className="text-[11px] text-surface-600 mt-0.5 flex flex-wrap gap-2">
                                    {med.frequency && <span>التكرار: {med.frequency}</span>}
                                    {med.duration && <span>المدة: {med.duration}</span>}
                                  </div>
                                  {med.notes && (
                                    <p className="text-[11px] text-surface-500 italic mt-0.5">{med.notes}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {prescription.instructions && (
                          <div className="p-2 bg-surface-100 rounded text-surface-700">
                            <span className="font-bold text-surface-900 block mb-0.5">تعليمات الاستخدام:</span>
                            {prescription.instructions}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
