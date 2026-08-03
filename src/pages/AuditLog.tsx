import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  ipAddress: string;
  createdAt: string;
  user: { fullName: string } | null;
}

export default function AuditLog() {
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data: logs, isLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ['audit-logs', entityFilter, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (entityFilter) params.append('entity', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      const res = await api.get(`/audit-logs?${params.toString()}`);
      return res.data.data;
    }
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'POST': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">إنشاء</span>;
      case 'PUT':
      case 'PATCH': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">تعديل</span>;
      case 'DELETE': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">حذف</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">{action}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">الكيان (Entity)</label>
          <input
            type="text"
            placeholder="مثال: CLIENTS, INVOICES..."
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value.toUpperCase())}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-rose-500 focus:ring-rose-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-rose-500 focus:ring-rose-500"
          >
            <option value="">الكل</option>
            <option value="POST">إنشاء (POST)</option>
            <option value="PUT">تعديل (PUT)</option>
            <option value="PATCH">تعديل جزئي (PATCH)</option>
            <option value="DELETE">حذف (DELETE)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4">المستخدم</th>
                  <th className="py-3 px-4">العملية</th>
                  <th className="py-3 px-4">الكيان (Entity)</th>
                  <th className="py-3 px-4">رقم الكيان (ID)</th>
                  <th className="py-3 px-4">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">لا توجد سجلات مطابقة.</td>
                  </tr>
                ) : (
                  logs?.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {log.user?.fullName || 'غير معروف'}
                        <div className="text-xs text-gray-400 mt-0.5">{log.ipAddress}</div>
                      </td>
                      <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{log.entity}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-xs truncate max-w-[120px]" title={log.entityId}>
                        {log.entityId}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => alert(JSON.stringify(log.newValues || log.oldValues, null, 2))}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 px-2 py-1 rounded"
                        >
                          عرض JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
