import { useState } from 'react';
import Card from '../Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { QrCode, Smartphone, RefreshCw, LogOut, Plus, Trash2, Link } from 'lucide-react';

export default function WhatsAppConnectionTab({ instances, status }: { instances: any[], status: any }) {
  const queryClient = useQueryClient();
  const [pairingPhone, setPairingPhone] = useState('');
  
  // Settings for AI
  const { data: settings } = useQuery({ 
    queryKey: ['wa-settings'], 
    queryFn: () => api.get('/whatsapp/settings').then(r => r.data) 
  });

  const [aiForm, setAiForm] = useState({
    aiEnabled: false,
    aiSuperAdminPhone: '',
    aiMasterPrompt: '',
    aiCampaignInstructions: ''
  });

  // Populate AI form when settings load
  useState(() => {
    if (settings) {
      setAiForm({
        aiEnabled: settings.aiEnabled || false,
        aiSuperAdminPhone: settings.aiSuperAdminPhone || '',
        aiMasterPrompt: settings.aiMasterPrompt || '',
        aiCampaignInstructions: settings.aiCampaignInstructions || ''
      });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => api.put('/whatsapp/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wa-settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    }
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(aiForm);
  };

  const checkConnectionMutation = useMutation({
    mutationFn: () => api.get('/whatsapp/status'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wa-status'] });
      toast.success('تم تحديث حالة الاتصال');
    }
  });

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      {/* Left Panel: Connection */}
      <Card className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-surface-800">إعدادات الربط والاتصال (WhatsApp)</h2>
          <p className="text-sm text-surface-500 mt-1">إدارة حالة الاتصال، مسح الكود، واستقبال إعدادات الأداة.</p>
        </div>

        <div className="flex justify-between items-center bg-surface-50 p-4 rounded-lg border border-surface-200">
          <div>
            <p className="text-sm font-semibold text-surface-600">حالة الاتصال بالسيرفر</p>
            <p className={`text-xl font-bold ${status?.connected ? 'text-emerald-600' : 'text-rose-600'}`}>
              {status?.connected ? 'متصل' : 'غير متصل'}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => checkConnectionMutation.mutate()}
              disabled={checkConnectionMutation.isPending}
              className="btn-secondary py-1.5 px-3 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${checkConnectionMutation.isPending ? 'animate-spin' : ''}`} /> تحديث
            </button>
            <button className="btn-primary bg-rose-600 hover:bg-rose-700 py-1.5 px-3 flex items-center gap-2 border-transparent">
              <LogOut className="w-4 h-4" /> خروج
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {/* Method 1: QR */}
          <div>
            <h3 className="font-semibold text-surface-800 flex items-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-emerald-600"/> مسح رمز QR
            </h3>
            <p className="text-xs text-surface-500 mb-4 leading-relaxed">افتح واتساب &gt; الأجهزة المرتبطة &gt; ربط جهاز</p>
            
            <div className="w-48 h-48 bg-surface-100 border border-surface-200 rounded-lg flex items-center justify-center">
              <p className="text-sm text-surface-400">في انتظار الرمز...</p>
            </div>
          </div>

          {/* Divider on large screens */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-surface-200 -translate-x-1/2"></div>

          {/* Method 2: Pairing Code */}
          <div>
            <h3 className="font-semibold text-surface-800 flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-emerald-600"/> رمز مباشر
            </h3>
            <p className="text-xs text-surface-500 mb-4 leading-relaxed">أدخل رقم الهاتف لطلب رمز ربط (بدون كاميرا)</p>
            
            <label className="block text-xs font-medium mb-1">رقم الهاتف (بصيغة دولية: 2010...)</label>
            <input 
              type="text" 
              value={pairingPhone}
              onChange={e => setPairingPhone(e.target.value)}
              className="input-field w-full mb-3 text-sm py-2" 
              placeholder="مثال: 201012345678"
            />
            <button className="btn-primary w-full py-2 bg-emerald-600 hover:bg-emerald-700">طلب الرمز</button>
          </div>
        </div>
      </Card>

      {/* Right Panel: Instances & AI Settings */}
      <div className="space-y-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">النسخ الفعالة (Instances)</h3>
          </div>
          
          <div className="space-y-3 mb-4">
            {instances.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-4">لا توجد أرقام مضافة</p>
            ) : (
              instances.map((instance: any) => (
                <div key={instance.name} className="flex justify-between items-center bg-surface-50 border border-surface-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${instance.status === 'open' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <div>
                      <p className="font-bold text-sm text-surface-800">{instance.name}</p>
                      <p className="text-xs text-surface-500" dir="ltr">{instance.phone || 'غير معروف'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors">
                      <Link className="w-3 h-3" /> ربط
                    </button>
                    <button className="bg-rose-100 text-rose-700 hover:bg-rose-200 px-2 py-1 rounded text-xs font-semibold flex items-center transition-colors" title="حذف النسخة">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button className="w-full btn-secondary border-blue-500 text-blue-600 hover:bg-blue-50 py-2 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> إضافة رقم / نسخة جديدة
          </button>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4">إعدادات مساعد الذكاء الاصطناعي (AI Agent)</h3>
          
          <label className="flex items-center gap-2 cursor-pointer mb-5">
            <input 
              type="checkbox" 
              checked={aiForm.aiEnabled}
              onChange={e => setAiForm({...aiForm, aiEnabled: e.target.checked})}
              className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-surface-700">تفعيل الرد الآلي بالذكاء الاصطناعي</span>
          </label>

          {aiForm.aiEnabled && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">رقم هاتف المدير (Super Admin) للاستعلام الإداري:</label>
                <input 
                  type="text" 
                  value={aiForm.aiSuperAdminPhone}
                  onChange={e => setAiForm({...aiForm, aiSuperAdminPhone: e.target.value})}
                  className="input-field w-full text-sm" 
                  placeholder="مثال: 2010..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">التعليمات الرئيسية للبوت (Master Prompt):</label>
                <textarea 
                  value={aiForm.aiMasterPrompt}
                  onChange={e => setAiForm({...aiForm, aiMasterPrompt: e.target.value})}
                  className="input-field w-full h-32 text-sm leading-relaxed" 
                  placeholder="أنت مساعد ذكي لعيادة باتشي..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">تعليمات الحملة الإعلانية والعروض المؤقتة:</label>
                <textarea 
                  value={aiForm.aiCampaignInstructions}
                  onChange={e => setAiForm({...aiForm, aiCampaignInstructions: e.target.value})}
                  className="input-field w-full h-20 text-sm leading-relaxed" 
                  placeholder="يوجد عرض خصم 50% على جلسات الليزر..."
                />
              </div>
            </div>
          )}

          <button 
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 py-3 mt-6 font-bold text-base border-transparent"
          >
            {updateSettingsMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </Card>
      </div>
    </div>
  );
}
