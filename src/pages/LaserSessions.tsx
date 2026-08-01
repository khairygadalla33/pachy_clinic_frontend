import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { formatDate } from '../lib/utils';
import { Activity } from 'lucide-react';

export default function LaserSessions() {
  const [page] = useState(1);
  const [search] = useState('');
  
  const { data: response, isLoading } = useQuery({
    queryKey: ['laserSessions', page, search],
    queryFn: () => api.get(`/sessions/laser?page=${page}&limit=20&search=${search}`).then(r => r.data),
  });

  const getReactionColor = (r: string) => {
    switch(r) {
      case 'NONE': return 'success';
      case 'MILD': return 'info';
      case 'MODERATE': return 'warning';
      case 'SEVERE': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="text-primary-600"/> جلسات الليزر</h1>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b text-surface-500">
                <th className="pb-3 px-4">التاريخ</th>
                <th className="pb-3 px-4">العميل</th>
                <th className="pb-3 px-4">المنطقة</th>
                <th className="pb-3 px-4">النبضات</th>
                <th className="pb-3 px-4">التكلفة</th>
                <th className="pb-3 px-4">رد فعل الجلد</th>
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
                    <td className="py-3 px-4">{session.bodyArea}</td>
                    <td className="py-3 px-4">{session.numberOfPulses || '-'}</td>
                    <td className="py-3 px-4 font-bold">{session.calculatedCost || '-'} ج.م</td>
                    <td className="py-3 px-4"><Badge variant={getReactionColor(session.skinReaction)}>{session.skinReaction}</Badge></td>
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
