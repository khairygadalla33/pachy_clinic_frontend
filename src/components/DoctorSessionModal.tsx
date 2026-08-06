import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Activity, FileText, CheckCircle, Plus, Zap, Syringe, Sparkles, Scissors, Cloud, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import SessionForm from './SessionForm';
import PrescriptionForm from './PrescriptionForm';
import PatientHistorySidebar from './PatientHistorySidebar';

interface DoctorSessionModalProps {
  queueItem: any;
  onClose: () => void;
  onSessionComplete: () => void;
}

// Resolve service category type to an icon and color
function getServiceMeta(categoryType?: string, categoryName?: string) {
  const ct = (categoryType || categoryName || '').toUpperCase();
  const activeClass = 'bg-purple-600 text-white border-purple-600 shadow-md';
  const inactiveClass = 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';

  if (ct.includes('LASER') || ct.includes('CRYO') || ct.includes('CAVITATION'))
    return { icon: <Zap className="w-4 h-4" />, activeClass, inactiveClass, label: 'جلسة ليزر' };
  if (ct.includes('INJECT') || ct.includes('FILLER') || ct.includes('BOTOX'))
    return { icon: <Syringe className="w-4 h-4" />, activeClass, inactiveClass, label: 'حقن وتجميل' };
  if (ct.includes('SKIN'))
    return { icon: <Sparkles className="w-4 h-4" />, activeClass, inactiveClass, label: 'عناية بالبشرة' };
  if (ct.includes('HAIR'))
    return { icon: <Scissors className="w-4 h-4" />, activeClass, inactiveClass, label: 'عناية بالشعر' };
  return { icon: <Activity className="w-4 h-4" />, activeClass, inactiveClass, label: 'خدمة' };
}

export default function DoctorSessionModal({ queueItem, onClose, onSessionComplete }: DoctorSessionModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'prescription'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [selectedNewService, setSelectedNewService] = useState('');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  
  // Track which booked service is currently selected for editing
  const [selectedServiceIdx, setSelectedServiceIdx] = useState(0);
  
  // Fetch services for the add service tab
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(res => res.data)
  });

  if (!queueItem) return null;

  const patient = queueItem.client;
  const appointment = queueItem.appointment;
  
  // All booked services for this appointment
  const appointmentServices: any[] = appointment?.appointmentServices || [];
  const bookedServices = appointmentServices.map((as: any) => ({
    id: as.service?.id,
    name: as.service?.nameAr || as.service?.name || 'خدمة',
    categoryType: as.service?.category?.type || as.service?.category?.name || '',
    categoryName: as.service?.category?.nameAr || as.service?.category?.name || '',
    unitPrice: as.unitPrice,
    pricingId: as.pricingId,
  }));

  // Currently selected service
  const currentService = bookedServices[selectedServiceIdx] || bookedServices[0];

  // Calculate total estimated cost and remaining amount
  const totalCost = appointmentServices.reduce((sum: number, as: any) => {
    const price = as.unitPrice !== null && as.unitPrice !== undefined ? Number(as.unitPrice) : Number(as.service?.pricings?.[0]?.price || 0);
    return sum + price;
  }, 0);

  const previousPayments = (appointment?.invoices || []).flatMap((inv: any) => inv.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const totalPaidSoFar = previousPayments > 0 ? previousPayments : Number(appointment?.depositAmount || 0);
  const remainingAmount = Math.max(0, totalCost - totalPaidSoFar);

  const handleAddService = async () => {
    if (!selectedNewService) return;
    try {
      setIsSubmitting(true);
      await api.post(`/appointments/${appointment.id}/services`, { serviceId: selectedNewService });
      toast.success('تم إضافة الخدمة بنجاح');
      setSelectedNewService('');
      setIsAddingService(false);
      onSessionComplete();
    } catch (error: any) {
      toast.error('حدث خطأ أثناء إضافة الخدمة: ' + (error.response?.data?.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = queueItem?.stage === 'COMPLETED' || queueItem?.stage === 'PENDING_CHECKOUT';

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);

      if (queueItem.stage !== 'IN_SESSION') {
        await api.put(`/workflow/${queueItem.id}/start-session`);
      }

      // Automatically send the latest prescription via WhatsApp if it exists
      try {
        const presRes = await api.get('/prescriptions', { params: { appointmentId: appointment.id } });
        const prescriptions = presRes.data;
        if (prescriptions && prescriptions.length > 0) {
           const latestPrescription = prescriptions[0]; // ordered by createdAt desc
           await api.post(`/prescriptions/${latestPrescription.id}/send-whatsapp`);
           toast.success('تم إرسال الروشتة عبر الواتساب بنجاح');
        }
      } catch (err) {
        console.error('Failed to send WhatsApp', err);
      }

      await api.put(`/workflow/${queueItem.id}/end-session`);
      
      toast.success(isEditMode ? 'تم تحديث الزيارة وتحويلها للاستقبال للتسوية' : 'تم إنهاء الجلسة وتحويل المريض للاستقبال');
      onSessionComplete();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إنهاء/تحديث الزيارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl h-[92vh] flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ──── RIGHT SIDE: Patient History (1/3) - Placed first to appear on the right in RTL ──── */}
        <PatientHistorySidebar clientId={patient.id} excludeAppointmentId={appointment.id} />

        {/* ──── LEFT SIDE: Session Content (2/3) ──── */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface-50">
          
          {/* ═══════════ HEADER ═══════════ */}
          <div 
            className="px-4 py-2 border-b flex-shrink-0 text-white rounded-tr-2xl" 
            style={{ backgroundColor: '#c0389f', borderColor: '#c0389f' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Patient Avatar */}
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {patient?.fullName?.substring(0, 2) || 'م'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">{patient?.fullName}</h2>
                    {isEditMode && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400/90 text-amber-950 rounded-full shadow-sm">
                        تعديل زيارة
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/90 mt-0.5">
                    <span className="font-mono font-medium">{patient?.fileNumber || 'بدون رقم ملف'}</span>
                    {patient?.age && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/50"></span>
                        <span>السن: {patient.age}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Status in Header */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-medium text-white/90">
                  {saveStatus === 'SAVING' && (
                    <><Loader2 className="w-4 h-4 text-white animate-spin" /> جاري الحفظ...</>
                  )}
                  {saveStatus === 'SAVED' && (
                    <><CheckCircle2 className="w-4 h-4 text-green-300" /> تم الحفظ</>
                  )}
                  {saveStatus === 'ERROR' && (
                    <><AlertCircle className="w-4 h-4 text-red-200" /> خطأ في الحفظ</>
                  )}
                  {saveStatus === 'IDLE' && (
                    <><Cloud className="w-4 h-4 text-white/70" /> في انتظار الكتابة للحفظ...</>
                  )}
                </div>
                
                <button 
                  onClick={onClose}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
            
          {/* Tabs */}
          <div className="flex border-b border-surface-200 px-6 flex-shrink-0 bg-white items-center">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex items-center gap-2 py-3.5 px-4 font-bold text-sm border-b-2 transition-colors ${
                    activeTab === 'details' 
                      ? 'border-primary-500 text-primary-700' 
                      : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  تفاصيل الجلسة
                </button>
                <button
                  onClick={() => setActiveTab('prescription')}
                  className={`flex items-center gap-2 py-3.5 px-4 font-bold text-sm border-b-2 transition-colors ${
                    activeTab === 'prescription' 
                      ? 'border-primary-500 text-primary-700' 
                      : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  الروشتة والأدوية
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-surface-50">
              
              {/* Inline Add Service UI */}
              {isAddingService && (
                <div className="bg-white p-4 rounded-xl border border-primary-200 shadow-sm mb-4 animate-in slide-in-from-top-2">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-surface-700 mb-1">اختر خدمة لإضافتها للزيارة</label>
                      <select 
                        className="input-field text-sm py-2"
                        value={selectedNewService}
                        onChange={e => setSelectedNewService(e.target.value)}
                      >
                        <option value="">اختر الخدمة...</option>
                        {servicesData?.data?.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.nameAr})</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      className="btn-primary py-2 px-5 flex items-center gap-1" 
                      onClick={handleAddService}
                      disabled={!selectedNewService || isSubmitting}
                    >
                      <Plus className="w-4 h-4" /> إضافة للعميل
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-4">
                  {/* ─── Service Chips Row ─── */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      {bookedServices.map((svc: any, idx: number) => {
                        const meta = getServiceMeta(svc.categoryType, svc.categoryName);
                        const isActive = idx === selectedServiceIdx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedServiceIdx(idx)}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-bold transition-all ${
                              isActive ? meta.activeClass : meta.inactiveClass
                            }`}
                          >
                            {meta.icon}
                            {meta.label}
                            {svc.name && <span className={isActive ? "text-white/90 font-medium" : "opacity-80 font-medium"}>— {svc.name}</span>}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setIsAddingService(!isAddingService)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                        isAddingService 
                          ? 'bg-primary-50 text-primary-700 border-primary-200' 
                          : 'bg-white text-primary-600 border-surface-200 hover:bg-primary-50 hover:border-primary-200'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة خدمة أخرى
                    </button>
                  </div>

                  {/* ─── Dynamic Session Form based on selected service ─── */}
                  {currentService ? (
                    <SessionForm 
                      categoryType={currentService.categoryType}
                      appointmentId={appointment.id}
                      clientId={patient.id}
                      serviceId={currentService.id}
                      serviceName={currentService.name}
                      onSuccess={() => toast.success('تم حفظ تفاصيل الجلسة')}
                      onCancel={onClose}
                      onSaveStatusChange={setSaveStatus}
                    />
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-primary-300 text-center text-surface-400">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">لا توجد خدمات محجوزة لهذا الموعد</p>
                      <p className="text-xs mt-1">يمكنك إضافة خدمة من تبويب "إضافة خدمات"</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'prescription' && (
                <div className="bg-white p-6 rounded-2xl border border-primary-300 shadow-sm">
                  <PrescriptionForm 
                    clientId={patient.id}
                    appointmentId={appointment.id}
                    onSuccess={() => toast.success('تم حفظ الروشتة')}
                    onCancel={onClose}
                    onSaveStatusChange={setSaveStatus}
                  />
                </div>
              )}

            </div>
            
            {/* Footer Redesign */}
            <div className="px-4 py-2 border-t border-[#2d3e4c] bg-[#3a5061] flex items-center justify-between flex-shrink-0 rounded-b-2xl gap-4 overflow-x-auto">
              
              {/* Right: Cancel Button */}
              <button 
                className="whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 bg-transparent text-red-300 hover:text-white hover:bg-red-500/30 border border-red-500/30"
                onClick={() => toast.error('جاري برمجة الزر - لم يكتمل بعد')}
                disabled={isSubmitting}
              >
                إلغاء الجلسة
              </button>

              {/* Center: Cost Card */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-lg border border-white/20 shadow-sm flex items-center gap-3 whitespace-nowrap" title="المبلغ المتبقي المطلوب تحصيله بالاستقبال">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70 font-medium mb-0.5">المطلوب تحصيله بالاستقبال</span>
                  <div className="flex items-baseline gap-1 leading-none">
                    <span className="text-lg font-bold text-white">{remainingAmount.toLocaleString('en-US')}</span>
                    <span className="text-xs font-bold text-white/80">ج.م</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💳</span>
                </div>
              </div>

              {/* Left: Actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button 
                  className="whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 bg-white/10 text-white hover:bg-white/20 border border-white/10" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  إغلاق (مسودة)
                </button>
                <button 
                  className="whitespace-nowrap px-8 py-1.5 min-w-[160px] rounded-lg text-sm font-bold transition-all duration-300 bg-white text-[#3a5061] hover:bg-gray-100 shadow-md flex items-center justify-center gap-1.5 transform hover:-translate-y-0.5"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-[#3a5061] border-t-transparent rounded-full"></span>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isEditMode ? 'تحديث وإرسال للاستقبال' : 'إنهاء وتحويل للاستقبال'}
                </button>
              </div>
            </div>
          </div>

      </div>
    </div>
  );
}
