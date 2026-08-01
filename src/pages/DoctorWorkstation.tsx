import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, CheckCircle, FileText, Activity } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import SessionForm from '../components/SessionForm';
import PrescriptionForm from '../components/PrescriptionForm';

export default function DoctorWorkstation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const branchId = '022d4f55-1f8d-4f11-9a70-4f5b2b2b1e1b'; // Default

  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'LASER' | 'INJECTION' | 'SKIN_CARE'>('LASER');
  
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Queue Polling
  const { data: queueItems } = useQuery({
    queryKey: ['workflow-queue', branchId],
    queryFn: () => api.get(`/workflow/queue/${branchId}`).then(r => r.data),
    refetchInterval: 10000,
  });

  // Filter queue for current doctor (if not admin)
  const doctorQueue = queueItems?.filter((q: any) => {
    // Only show patients that are in DOCTOR_SESSION or waiting for it
    const validStatuses = ['WAITING_FOR_DOCTOR', 'DOCTOR_SESSION'];
    if (!validStatuses.includes(q.status)) return false;
    
    // If not admin, only show patients assigned to this doctor
    if (user?.role !== 'ADMIN' && q.assignedStaffId !== user?.id) return false;
    
    return true;
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string, status: string }) => api.put(`/workflow/queue/${data.id}/status`, { status: data.status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflow-queue'] }),
  });

  const handleStartSession = (queueId: string, patientId: string, appointmentId: string, serviceId: string, categoryName: string) => {
    setActivePatientId(patientId);
    setActiveQueueId(queueId);
    setActiveAppointmentId(appointmentId);
    setActiveServiceId(serviceId);

    // Determine session type from category name
    const cat = categoryName.toUpperCase();
    if (cat.includes('LASER')) setSessionType('LASER');
    else if (cat.includes('INJECT') || cat.includes('FILLER') || cat.includes('BOTOX')) setSessionType('INJECTION');
    else setSessionType('SKIN_CARE');

    updateStatusMutation.mutate({ id: queueId, status: 'DOCTOR_SESSION' });
  };

  const handleFinishSession = (queueId: string) => {
    updateStatusMutation.mutate({ id: queueId, status: 'WAITING_FOR_PAYMENT' });
    setActivePatientId(null);
    setActiveQueueId(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Doctor Workstation</h1>
          <p className="text-surface-500">Manage your current patients and sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Queue */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
            <div className="p-4 border-b border-surface-200 bg-surface-50">
              <h2 className="font-bold text-surface-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary-500" />
                Waiting Patients
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {doctorQueue?.length === 0 ? (
                <div className="text-center py-8 text-surface-400">
                  No patients waiting for you right now.
                </div>
              ) : (
                doctorQueue?.map((q: any) => (
                  <div key={q.id} className={`p-4 rounded-lg border ${activeQueueId === q.id ? 'border-primary-500 bg-primary-50' : 'border-surface-200 bg-white'} transition-colors`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-surface-900">{q.client.firstName} {q.client.lastName}</div>
                        <div className="text-sm text-surface-500">{q.appointment.service.name}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${q.status === 'DOCTOR_SESSION' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {q.status === 'DOCTOR_SESSION' ? 'In Session' : 'Waiting'}
                      </span>
                    </div>
                    
                    {q.status === 'WAITING_FOR_DOCTOR' && (
                      <button 
                        onClick={() => handleStartSession(q.id, q.client.id, q.appointment.id, q.appointment.service.id, q.appointment.service.category.name)}
                        className="w-full mt-3 flex items-center justify-center btn-primary py-2 text-sm"
                      >
                        <Play className="w-4 h-4 mr-2" /> Start Session
                      </button>
                    )}
                    
                    {q.status === 'DOCTOR_SESSION' && activeQueueId !== q.id && (
                      <button 
                        onClick={() => handleStartSession(q.id, q.client.id, q.appointment.id, q.appointment.service.id, q.appointment.service.category.name)}
                        className="w-full mt-3 flex items-center justify-center btn-secondary py-2 text-sm text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        Resume Session
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Session Workspace */}
        <div className="lg:col-span-2">
          {activePatientId && activeQueueId ? (
            <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-200">
                <div>
                  <h2 className="text-xl font-bold text-surface-900">Active Session</h2>
                  <p className="text-surface-500">Record session details and write prescriptions</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowSessionModal(true)} className="btn-secondary flex items-center">
                    <Activity className="w-4 h-4 mr-2" /> Record Session
                  </button>
                  <button onClick={() => setShowPrescriptionModal(true)} className="btn-secondary flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> Write Prescription
                  </button>
                  <button onClick={() => handleFinishSession(activeQueueId)} className="btn-primary bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" /> Finish & Send to Reception
                  </button>
                </div>
              </div>
              
              {/* Optional: Add Patient History Summary Here */}
              <div className="bg-surface-50 rounded-lg p-6 border border-surface-200 flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <Activity className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-1">Workspace Ready</h3>
                <p className="text-surface-500 max-w-md">
                  Click the buttons above to record the session details, upload before/after photos, or write a prescription.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-10 h-10 text-surface-400" />
              </div>
              <h2 className="text-xl font-bold text-surface-900 mb-2">No Active Session</h2>
              <p className="text-surface-500 max-w-md">
                Select a patient from the queue to start their session. You can record session parameters and write prescriptions here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSessionModal && activePatientId && activeAppointmentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-surface-900">Record {sessionType} Session</h2>
              <button onClick={() => setShowSessionModal(false)} className="text-surface-400 hover:text-surface-600">&times;</button>
            </div>
            <div className="p-6">
              <SessionForm 
                type={sessionType}
                appointmentId={activeAppointmentId}
                clientId={activePatientId}
                serviceId={activeServiceId!}
                onSuccess={() => setShowSessionModal(false)}
                onCancel={() => setShowSessionModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showPrescriptionModal && activePatientId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-surface-900">Write Prescription</h2>
              <button onClick={() => setShowPrescriptionModal(false)} className="text-surface-400 hover:text-surface-600">&times;</button>
            </div>
            <div className="p-6">
              <PrescriptionForm 
                clientId={activePatientId}
                appointmentId={activeAppointmentId!}
                onSuccess={() => setShowPrescriptionModal(false)}
                onCancel={() => setShowPrescriptionModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
