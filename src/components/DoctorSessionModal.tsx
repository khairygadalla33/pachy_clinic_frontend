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
  const [activeTab, setActiveTab] = useState<'details' | 'prescription'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!queueItem) return null;

  const patient = queueItem.client;
  const appointment = queueItem.appointment;
  const service = appointment?.service;

  let sessionType: 'LASER' | 'INJECTION' | 'SKIN_CARE' = 'SKIN_CARE';
  if (service?.category?.name) {
    const cat = service.category.name.toUpperCase();
    if (cat.includes('LASER')) sessionType = 'LASER';
    else if (cat.includes('INJECT') || cat.includes('FILLER') || cat.includes('BOTOX')) sessionType = 'INJECTION';
  }

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
                <span className="font-medium text-primary-600">{service?.nameAr || service?.name}</span>
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
