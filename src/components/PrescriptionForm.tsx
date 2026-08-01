import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Send } from 'lucide-react';
import api from '../lib/api';

interface PrescriptionFormProps {
  clientId: string;
  appointmentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PrescriptionForm({ clientId, appointmentId, onSuccess, onCancel }: PrescriptionFormProps) {
  const queryClient = useQueryClient();
  const [branchId] = useState('022d4f55-1f8d-4f11-9a70-4f5b2b2b1e1b'); // Default

  const [medications, setMedications] = useState([{ name: '', dose: '', frequency: '', duration: '', notes: '' }]);
  const [instructions, setInstructions] = useState('');
  const [nextSessionDate, setNextSessionDate] = useState('');
  const [nextSessionNotes, setNextSessionNotes] = useState('');

  // Load templates
  const { data: templates } = useQuery({
    queryKey: ['prescription-templates'],
    queryFn: () => api.get('/prescription-templates').then(r => r.data.data),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { sendWhatsapp: boolean }) => {
      const payload = {
        clientId,
        appointmentId,
        branchId,
        instructions,
        nextSessionDate: nextSessionDate || undefined,
        nextSessionNotes,
        medications: medications.map(m => ({
          medicationName: m.name,
          dose: m.dose,
          frequency: m.frequency,
          duration: m.duration,
          notes: m.notes,
        })).filter(m => m.medicationName),
      };

      const res = await api.post('/prescriptions', payload);
      
      if (data.sendWhatsapp) {
        try {
          await api.post(`/prescriptions/${res.data.id}/send-whatsapp`);
        } catch (e: any) {
          console.error('WhatsApp sending failed:', e);
          alert(e.response?.data?.message || 'Failed to send WhatsApp message. The prescription was saved successfully.');
        }
      }

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      onSuccess();
    },
  });

  const handleSubmit = (sendWhatsapp: boolean) => {
    submitMutation.mutate({ sendWhatsapp });
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = templates?.find((t: any) => t.id === e.target.value);
    if (template) {
      if (template.instructionsText) setInstructions(template.instructionsText);
      // Optional: fill medications from template if needed
    }
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dose: '', frequency: '', duration: '', notes: '' }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  return (
    <div className="space-y-6">
      {/* Medications */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-surface-900">Medications</h3>
          <button type="button" onClick={addMedication} className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center">
            <Plus className="w-3 h-3 mr-1" /> Add Medicine
          </button>
        </div>
        <div className="space-y-3">
          {medications.map((med, i) => (
            <div key={i} className="p-3 bg-surface-50 border border-surface-200 rounded-lg flex gap-3 items-start">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-surface-500 mb-1">Medicine Name</label>
                  <input type="text" className="input-field text-sm py-1.5" placeholder="e.g. Fusidic Acid" value={med.name} onChange={e => updateMedication(i, 'name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1">Dose</label>
                  <input type="text" className="input-field text-sm py-1.5" value={med.dose} onChange={e => updateMedication(i, 'dose', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1">Frequency</label>
                  <input type="text" className="input-field text-sm py-1.5" placeholder="e.g. Twice daily" value={med.frequency} onChange={e => updateMedication(i, 'frequency', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1">Duration</label>
                  <input type="text" className="input-field text-sm py-1.5" placeholder="e.g. 5 days" value={med.duration} onChange={e => updateMedication(i, 'duration', e.target.value)} />
                </div>
              </div>
              {medications.length > 1 && (
                <button type="button" onClick={() => removeMedication(i)} className="p-2 text-surface-400 hover:text-red-500 rounded-md hover:bg-red-50 mt-5">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-surface-900">Instructions</h3>
          <select className="text-xs border-surface-300 rounded py-1 pl-2 pr-6" onChange={handleTemplateChange}>
            <option value="">Load Template...</option>
            {templates?.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <textarea 
          className="input-field min-h-[100px]" 
          placeholder="Write instructions or load from a template..."
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
        />
      </div>

      {/* Next Session */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Next Session Date</label>
          <input type="date" className="input-field" value={nextSessionDate} onChange={e => setNextSessionDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Next Session Notes</label>
          <input type="text" className="input-field" value={nextSessionNotes} onChange={e => setNextSessionNotes(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="button" onClick={() => handleSubmit(false)} disabled={submitMutation.isPending} className="btn-secondary text-primary-600 border-primary-200 bg-primary-50 hover:bg-primary-100">
          Save Only
        </button>
        <button type="button" onClick={() => handleSubmit(true)} disabled={submitMutation.isPending} className="btn-primary bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white">
          <Send className="w-4 h-4 mr-2" /> Save & WhatsApp
        </button>
      </div>
    </div>
  );
}
