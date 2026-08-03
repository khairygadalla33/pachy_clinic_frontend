import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Card from '../components/Card';
import { formatDate } from '../lib/utils';

export default function SkinCareSessions() {
  const [search] = useState('');
  
  const { data: response, isLoading } = useQuery({
    queryKey: ['skinCareSessions', search],
    queryFn: () => api.get(`/sessions/skin-care?search=${search}&limit=20`).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b text-surface-500">
                <th className="pb-3 px-4">التاريخ</th>
                <th className="pb-3 px-4">العميل</th>
                <th className="pb-3 px-4">الإجراء</th>
                <th className="pb-3 px-4">الطبيب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8">جاري التحميل...</td></tr>
              ) : response?.data?.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">لا يوجد جلسات</td></tr>
              ) : (
                response?.data?.map((session: any) => (
                  <tr key={session.id} className="hover:bg-surface-50">
                    <td className="py-3 px-4">{formatDate(session.performedAt)}</td>
                    <td className="py-3 px-4 font-medium">{session.client?.fullName}</td>
                    <td className="py-3 px-4">{session.procedureName}</td>
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
