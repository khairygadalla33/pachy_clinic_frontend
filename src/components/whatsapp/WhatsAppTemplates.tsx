import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Card from '../Card';
import { Plus, Trash2 } from 'lucide-react';
import LoadingSkeleton from '../LoadingSkeleton';

export default function WhatsAppTemplates() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [variations, setVariations] = useState<any[]>([]);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['wa-templates'],
    queryFn: () => api.get('/whatsapp/templates').then(res => res.data)
  });

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setVariations(template.variations || []);
  };

  const addVariationMutation = useMutation({
    mutationFn: (data: any) => api.post(`/whatsapp/templates/${selectedTemplate.id}/variations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wa-templates'] });
      toast.success('تمت الإضافة بنجاح');
      // In a real scenario we'd refetch or update local state better, but invalidation triggers a reload
    }
  });

  const deleteVariationMutation = useMutation({
    mutationFn: (id: string) => api.post(`/whatsapp/variations/${id}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wa-templates'] });
      toast.success('تم الحذف');
    }
  });

  const handleAddVariation = () => {
    if (!selectedTemplate) return;
    addVariationMutation.mutate({
      messageText: 'رسالة جديدة...',
      sortOrder: variations.length + 1
    });
  };

  const handleDeleteVariation = (id: string) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteVariationMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-1 h-[600px] overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-surface-900 pb-2 border-b flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">أنواع القوالب</h3>
          <button onClick={() => {
            const name = prompt('اسم القالب الجديد:');
            if (name) {
              api.post('/whatsapp/templates', { name, variables: '[]' }).then(() => {
                queryClient.invalidateQueries({ queryKey: ['wa-templates'] });
                toast.success('تم إنشاء القالب');
              });
            }
          }} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1">
            <Plus className="w-3 h-3"/> جديد
          </button>
        </div>
        <div className="space-y-2 flex-1">
          {templates?.map((tpl: any) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className={`w-full text-right p-3 rounded-xl border transition-all ${selectedTemplate?.id === tpl.id ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-surface-200 dark:border-surface-700 hover:border-emerald-300'}`}
            >
              <div className="font-medium">{tpl.name}</div>
              <div className="text-xs text-surface-500 mt-1">{tpl.variations?.length || 0} تنويعات (Variations)</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="md:col-span-2 h-[600px] overflow-y-auto">
        {selectedTemplate ? (
          <div>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                <p className="text-xs text-surface-500">متغيرات متاحة: {selectedTemplate.variables ? JSON.parse(selectedTemplate.variables).map((v: string) => `{{${v}}}`).join('، ') : 'لا يوجد'}</p>
              </div>
              <button onClick={handleAddVariation} disabled={addVariationMutation.isPending} className="btn-secondary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> إضافة رسالة
              </button>
            </div>

            <div className="space-y-6">
              {variations.length === 0 ? (
                <div className="text-center py-12 text-surface-500 border-2 border-dashed rounded-xl">لا توجد رسائل لهذا القالب. أضف رسالة جديدة لتفعيل النظام.</div>
              ) : (
                variations.map((v: any, idx: number) => (
                  <div key={v.id || idx} className="p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded">رسالة #{idx + 1}</span>
                      <button onClick={() => handleDeleteVariation(v.id)} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1.5 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea 
                      className="input-field w-full h-24 mb-2" 
                      defaultValue={v.messageText} 
                      onBlur={() => {
                        // Normally we'd auto-save here or have a save button for the specific variation.
                        // For the sake of this plan, let's assume we implement a save endpoint later or update it on blur.
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-surface-400">
            اختر قالباً من القائمة لعرض وتعديل محتواه
          </div>
        )}
      </Card>
    </div>
  );
}
