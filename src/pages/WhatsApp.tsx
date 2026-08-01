import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { formatDate } from '../lib/utils';
import { MessageSquare, Settings, CheckCircle2, Megaphone, Plus } from 'lucide-react';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function WhatsApp() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('campaigns');
  
  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  
  // Queries
  const { data: status } = useQuery({ queryKey: ['wa-status'], queryFn: () => api.get('/whatsapp/status').then(r => r.data) });
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({ queryKey: ['wa-campaigns'], queryFn: () => api.get('/whatsapp/campaigns').then(r => r.data) });
  
  const [campaignForm, setCampaignForm] = useState({ name: '', targetSegment: 'ALL', messageTemplate: '' });
  
  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => api.post('/whatsapp/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wa-campaigns'] });
      setIsCampaignModalOpen(false);
      alert('تم إطلاق الحملة بنجاح');
    }
  });

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(campaignForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-emerald-500" /> إدارة الواتساب (WhatsApp)
          </h1>
          <p className="text-surface-500 mt-1">إرسال حملات، إدارة القوالب، ورسائل الترحيب</p>
        </div>
        <div className="flex items-center gap-2">
          {status?.connected ? (
            <Badge variant="success" className="text-sm py-1.5"><CheckCircle2 className="w-4 h-4 mr-1"/> متصل</Badge>
          ) : (
            <Badge variant="danger" className="text-sm py-1.5">غير متصل</Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-surface-200 dark:border-surface-700">
        <button onClick={() => setActiveTab('campaigns')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeTab === 'campaigns' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>
          <Megaphone className="w-4 h-4" />الحملات (Campaigns)
        </button>
        <button onClick={() => setActiveTab('templates')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeTab === 'templates' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>
          <Settings className="w-4 h-4" />القوالب والإعدادات
        </button>
      </div>

      {activeTab === 'campaigns' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg">أحدث الحملات</h3>
            <button onClick={() => setIsCampaignModalOpen(true)} className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> حملة جديدة
            </button>
          </div>

          {isLoadingCampaigns ? <LoadingSkeleton rows={3} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b text-surface-500">
                    <th className="pb-3 px-4">اسم الحملة</th>
                    <th className="pb-3 px-4">الشريحة</th>
                    <th className="pb-3 px-4">المستهدفين</th>
                    <th className="pb-3 px-4 text-emerald-600">تم الإرسال</th>
                    <th className="pb-3 px-4 text-rose-600">فشل</th>
                    <th className="pb-3 px-4">الحالة</th>
                    <th className="pb-3 px-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {campaigns.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8">لا يوجد حملات</td></tr>
                  ) : (
                    campaigns.map((camp: any) => (
                      <tr key={camp.id}>
                        <td className="py-3 px-4 font-medium">{camp.name}</td>
                        <td className="py-3 px-4"><Badge>{camp.targetSegment}</Badge></td>
                        <td className="py-3 px-4 font-bold">{camp.totalRecipients}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">{camp.successfulSends}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">{camp.failedSends}</td>
                        <td className="py-3 px-4">
                          <Badge variant={camp.status === 'COMPLETED' ? 'success' : camp.status === 'RUNNING' ? 'info' : 'warning'}>{camp.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-xs">{formatDate(camp.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'templates' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-lg mb-4">قوالب الرسائل</h3>
            <p className="text-surface-500 text-sm mb-4">أضف القوالب المستخدمة في المحادثات السريعة (في صفحة ملف العميل).</p>
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-surface-200 rounded-xl text-surface-400">
              سيتم دمج القوالب من الإعدادات قريباً.
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold text-lg mb-4">رسائل الترحيب والمناسبات</h3>
            <p className="text-surface-500 text-sm mb-4">رسائل تلقائية يتم إرسالها عند أحداث معينة (مثل إضافة عميل جديد، حجز موعد).</p>
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-surface-200 rounded-xl text-surface-400">
              جاري تفعيل هذه الميزة...
            </div>
          </Card>
        </div>
      )}

      <Modal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} title="إطلاق حملة تسويقية جديدة">
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم الحملة</label>
            <input required type="text" value={campaignForm.name} onChange={e => setCampaignForm({...campaignForm, name: e.target.value})} className="input-field w-full" placeholder="مثال: عروض شهر رمضان" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">شريحة العملاء</label>
            <select value={campaignForm.targetSegment} onChange={e => setCampaignForm({...campaignForm, targetSegment: e.target.value})} className="input-field w-full">
              <option value="ALL">جميع العملاء</option>
              <option value="VIP">عملاء مميزين (VIP - أكثر من 10 زيارات)</option>
              <option value="NEW">عملاء جدد (زيارة واحدة أو أقل)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">نص الرسالة</label>
            <p className="text-xs text-surface-500 mb-2">يمكنك استخدام {'{{name}}'} لاستبدالها باسم العميل التلقائي.</p>
            <textarea required value={campaignForm.messageTemplate} onChange={e => setCampaignForm({...campaignForm, messageTemplate: e.target.value})} className="input-field w-full h-32" placeholder="مرحباً {{name}}، ..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <button type="button" onClick={() => setIsCampaignModalOpen(false)} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={createCampaignMutation.isPending} className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600">
              {createCampaignMutation.isPending ? 'جاري الإطلاق...' : 'إطلاق الحملة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
