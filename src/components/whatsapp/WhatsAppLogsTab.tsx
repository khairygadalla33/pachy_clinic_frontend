import { useState } from 'react';
import Card from '../Card';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { RefreshCw, Search } from 'lucide-react';
import LoadingSkeleton from '../LoadingSkeleton';

export default function WhatsAppLogsTab() {
  const [search, setSearch] = useState('');

  // Fetch from /whatsapp/logs (assuming we'll create this backend endpoint soon, mocked for now if it fails)
  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['wa-logs'],
    queryFn: () => api.get('/whatsapp/logs').then(res => res.data).catch(() => [
      { id: 1, createdAt: new Date().toISOString(), instanceName: 'Pachy_Clinic1', customerName: 'أحمد محمد', phone: '01012345678', type: 'Invoice', status: 'Delivered', error: null, text: 'مرحباً أحمد، مرفق فاتورة رقم 123...' },
      { id: 2, createdAt: new Date().toISOString(), instanceName: 'Pachy_Clinic1', customerName: 'سارة خالد', phone: '01112345678', type: 'Appointment', status: 'Sent', error: null, text: 'تذكير بموعد الحجز غداً الساعة 5...' },
      { id: 3, createdAt: new Date().toISOString(), instanceName: 'Pachy_Clinic1', customerName: 'محمود علي', phone: '01212345678', type: 'Broadcast', status: 'Failed', error: 'الرقم غير مسجل في الواتساب', text: 'عرض خاص بخصم 50%...' },
    ])
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">تم التسليم</span>;
      case 'Sent': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">تم الإرسال</span>;
      case 'Pending': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">قيد الانتظار</span>;
      case 'Failed': return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-xs font-bold underline cursor-pointer">فشل</span>;
      default: return <span className="bg-surface-100 text-surface-700 px-2 py-1 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  const getLogType = (type: string) => {
    switch (type) {
      case 'Invoice': return 'فاتورة';
      case 'Appointment': return 'تذكير حجز';
      case 'Broadcast': return 'برودكاست';
      case 'AutoReply': return 'رد آلي';
      default: return type;
    }
  };

  return (
    <Card className="flex flex-col h-[700px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-surface-800">سجل رسائل الواتساب</h2>
        
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث برقم الهاتف أو العميل..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 pr-4 py-2 text-sm w-64"
            />
            <Search className="w-4 h-4 text-surface-400 absolute left-3 top-2.5" />
          </div>
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="btn-secondary flex items-center gap-2 py-2 px-4"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> تحديث
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-surface-200 rounded-xl">
        <table className="w-full text-sm text-right">
          <thead className="bg-surface-50 sticky top-0 z-10 shadow-sm">
            <tr className="border-b border-surface-200">
              <th className="p-4 font-semibold text-surface-600 whitespace-nowrap">الوقت والتاريخ</th>
              <th className="p-4 font-semibold text-surface-600 whitespace-nowrap">النسخة (Instance)</th>
              <th className="p-4 font-semibold text-surface-600 whitespace-nowrap">العميل</th>
              <th className="p-4 font-semibold text-surface-600 whitespace-nowrap">الموبايل</th>
              <th className="p-4 font-semibold text-surface-600 whitespace-nowrap">نوع الرسالة</th>
              <th className="p-4 font-semibold text-surface-600 whitespace-nowrap">الخطأ (إن وجد)</th>
              <th className="p-4 font-semibold text-surface-600 whitespace-nowrap text-center">الحالة</th>
              <th className="p-4 font-semibold text-surface-600 w-1/3">نص الرسالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-4"><LoadingSkeleton rows={5} /></td>
              </tr>
            ) : logs?.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-surface-500">لا توجد رسائل في السجل</td>
              </tr>
            ) : (
              logs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-surface-50 transition-colors">
                  <td className="p-4 text-surface-600" dir="ltr">{new Date(log.createdAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                  <td className="p-4 font-medium text-surface-800">{log.instanceName}</td>
                  <td className="p-4 text-surface-700">{log.customerName || 'غير معروف'}</td>
                  <td className="p-4 text-surface-700" dir="ltr">{log.phone}</td>
                  <td className="p-4 text-surface-700">{getLogType(log.type)}</td>
                  <td className="p-4 text-rose-600 text-xs font-semibold max-w-[150px] truncate" title={log.error}>{log.error || '-'}</td>
                  <td className="p-4 text-center">{getStatusBadge(log.status)}</td>
                  <td className="p-4 text-surface-600 max-w-[250px] truncate" title={log.text}>{log.text}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
