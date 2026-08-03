import { useState } from 'react';
import { X, Activity, FileText, CheckCircle } from 'lucide-react';
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

export default function DoctorSessionModal({ queueItem, onClose, onSessionComplete }: DoctorSessionModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'prescription' | 'add_service'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNewService, setSelectedNewService] = useState('');
  
  // Fetch services for the add service tab
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(res => res.data)
  });

  if (!queueItem) return null;

  const patient = queueItem.client;
  const appointment = queueItem.appointment;
  const services = appointment?.appointmentServices?.map((as: any) => as.service) || [];
  const primaryService = services[0];

  let sessionType: 'LASER' | 'INJECTION' | 'SKIN_CARE' = 'SKIN_CARE';
  if (primaryService?.category?.name) {
    const cat = primaryService.category.name.toUpperCase();
    if (cat.includes('LASER')) sessionType = 'LASER';
    else if (cat.includes('INJECT') || cat.includes('FILLER') || cat.includes('BOTOX')) sessionType = 'INJECTION';
  }

  const handleAddService = async () => {
    if (!selectedNewService) return;
    try {
      setIsSubmitting(true);
      await api.post(`/appointments/${appointment.id}/services`, { serviceId: selectedNewService });
      toast.success('تم إضافة الخدمة بنجاح');
      setSelectedNewService('');
      // Force refresh of the queue so the modal gets the new data
      onSessionComplete(); // This usually refetches the queue
    } catch (error: any) {
      toast.error('حدث خطأ أثناء إضافة الخدمة: ' + (error.response?.data?.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);

      // If it wasn't in session yet, mark it as in session first?
      // Typically the modal might just finish it. But let's assume clicking it means starting/resuming it.
      if (queueItem.stage !== 'IN_SESSION') {
        await api.put(`/workflow/${queueItem.id}/start-session`);
      }

      // Finish session and move to pending checkout
      await api.put(`/workflow/${queueItem.id}/end-session`);
      
      toast.success('تم إنهاء الجلسة وتحويل المريض للاستقبال');
      onSessionComplete();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إنهاء الجلسة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl h-[90vh] flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Sidebar - Patient History */}
        <PatientHistorySidebar clientId={patient.id} excludeAppointmentId={appointment.id} />

        {/* Right Side - Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between bg-surface-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
              {patient?.fullName?.substring(0, 2) || 'م'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">{patient?.fullName}</h2>
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <span>{patient?.phone}</span>
                <span className="w-1 h-1 rounded-full bg-surface-300"></span>
                <span className="font-medium text-primary-600">
                  {services.map((s: any) => s.nameAr || s.name).join(' + ') || 'بدون خدمة'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-200 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-4 px-4 font-bold text-sm border-b-2 transition-colors ${
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
            className={`flex items-center gap-2 py-4 px-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'prescription' 
                ? 'border-primary-500 text-primary-700' 
                : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            الروشتة والأدوية
          </button>
          <button
            onClick={() => setActiveTab('add_service')}
            className={`flex items-center gap-2 py-4 px-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'add_service' 
                ? 'border-primary-500 text-primary-700' 
                : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
            }`}
          >
            <Plus className="w-4 h-4" />
            إضافة خدمات
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-50/30">
          {activeTab === 'details' && (
             <SessionForm 
               type={sessionType}
               appointmentId={appointment.id}
               clientId={patient.id}
               serviceId={service.id}
               onSuccess={() => toast.success('تم حفظ تفاصيل الجلسة')}
               onCancel={onClose}
             />
          )}

          {activeTab === 'prescription' && (
             <PrescriptionForm 
               clientId={patient.id}
               appointmentId={appointment.id}
               onSuccess={() => toast.success('تم حفظ الروشتة')}
               onCancel={onClose}
             />
          )}

          {activeTab === 'add_service' && (
            <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-surface-900">إضافة خدمة جديدة للجلسة الحالية</h3>
              <p className="text-sm text-surface-500">سيتم إضافة الخدمة إلى فاتورة المريض النهائية.</p>
              
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">اختر الخدمة</label>
                <select 
                  className="input-field"
                  value={selectedNewService}
                  onChange={e => setSelectedNewService(e.target.value)}
                >
                  <option value="">اختر الخدمة...</option>
                  {servicesData?.data?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.nameAr})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  className="btn-primary" 
                  onClick={handleAddService}
                  disabled={!selectedNewService || isSubmitting}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة للعميل
                </button>
              </div>
            </div>
          )}
        </div>

          {/* Footer */}
          <div className="p-4 border-t border-surface-200 bg-white flex justify-end gap-3">
            <button 
              className="btn-ghost" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              إغلاق
            </button>
            <button 
              className="btn-primary flex items-center gap-2"
              onClick={handleFinish}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              إنهاء الجلسة وتحويل للاستقبال
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
