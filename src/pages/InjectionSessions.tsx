import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Card from '../components/Card';
import { formatDate } from '../lib/utils';
import { Activity } from 'lucide-react';

export default function InjectionSessions() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['injectionSessions'],
    queryFn: () => api.get(`/sessions/injection?limit=20`).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="text-primary-600"/> جلسات الحقن</h1>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b text-surface-500">
                <th className="pb-3 px-4">التاريخ</th>
                <th className="pb-3 px-4">العميل</th>
                <th className="pb-3 px-4">المنتج</th>
                <th className="pb-3 px-4">المنطقة</th>
                <th className="pb-3 px-4">الكمية</th>
                <th className="pb-3 px-4">التقنية</th>
                <th className="pb-3 px-4">الطبيب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8">جاري التحميل...</td></tr>
              ) : response?.data?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">لا يوجد جلسات</td></tr>
              ) : (
                response?.data?.map((session: any) => (
                  <tr key={session.id} className="hover:bg-surface-50">
                    <td className="py-3 px-4">{formatDate(session.performedAt)}</td>
                    <td className="py-3 px-4 font-medium">{session.client?.fullName}</td>
                    <td className="py-3 px-4">{session.productUsed}</td>
                    <td className="py-3 px-4">{session.areaInjected}</td>
                    <td className="py-3 px-4">{session.quantityUsed} {session.quantityUnit || 'ml'}</td>
                    <td className="py-3 px-4">{session.techniqueUsed || '-'}</td>
                    <td className="py-3 px-4">{session.performedBy?.fullName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
