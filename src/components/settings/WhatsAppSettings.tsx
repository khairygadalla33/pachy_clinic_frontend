import { useQuery } from '@tanstack/react-query';
import { QrCode, Smartphone, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export default function WhatsAppSettings() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => api.get('/whatsapp/status').then((res: any) => res.data),
    refetchInterval: (data: any) => (data?.connected ? 30000 : 3000), // Poll faster when disconnected to get QR
  });

  if (isLoading) {
    return <div className="text-surface-500">جاري فحص حالة الواتساب...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-surface-900 flex items-center">
            <Smartphone className="w-6 h-6 mr-2 text-primary-600" />
            إعدادات الواتساب (المحرك المدمج)
          </h2>
          <p className="text-sm text-surface-500 mt-1">
            قم بربط رقم عيادتك لإرسال الرسائل التلقائية للمرضى (فواتير، روشتات، تذكيرات).
          </p>
        </div>
        <button 
          onClick={() => refetch()} 
          className="p-2 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="تحديث الحالة"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        <div className={`p-4 rounded-lg border ${status?.connected ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className="flex items-center">
            {status?.connected ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mr-3" />
                <div>
                  <h3 className="font-bold text-emerald-900">الواتساب متصل ويعمل بنجاح</h3>
                  <p className="text-sm text-emerald-700">يمكن للنظام الآن إرسال الرسائل التلقائية للمرضى.</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-rose-600 mr-3" />
                <div>
                  <h3 className="font-bold text-rose-900">الواتساب غير متصل</h3>
                  <p className="text-sm text-rose-700">يرجى مسح كود الـ QR للاتصال.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {!status?.connected && status?.qrCode && (
          <div className="border border-surface-200 rounded-lg p-8 flex flex-col items-center justify-center bg-surface-50">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-surface-200 mb-4 inline-block">
              <img src={status.qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
            </div>
            <h4 className="font-bold text-surface-900 text-lg mb-2 flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              امسح الكود باستخدام تطبيق الواتساب
            </h4>
            <ol className="text-sm text-surface-600 list-decimal list-inside space-y-1 text-right w-full max-w-sm">
              <li>افتح تطبيق WhatsApp على هاتفك.</li>
              <li>اضغط على القائمة (ثلاث نقاط) أو الإعدادات.</li>
              <li>اختر "الأجهزة المرتبطة" (Linked Devices).</li>
              <li>اضغط على "ربط جهاز" ووجه الكاميرا لهذا الكود.</li>
            </ol>
          </div>
        )}

        {!status?.connected && !status?.qrCode && (
          <div className="border border-surface-200 rounded-lg p-12 flex flex-col items-center justify-center bg-surface-50 text-surface-500">
            <RefreshCw className="w-8 h-8 mb-4 animate-spin text-primary-400" />
            <p>جاري توليد كود الـ QR... يرجى الانتظار بضع ثوانٍ.</p>
          </div>
        )}
      </div>
    </div>
  );
}
