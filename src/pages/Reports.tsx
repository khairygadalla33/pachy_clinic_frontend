import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Printer } from 'lucide-react';

const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'financial' | 'services' | 'clients'>('financial');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', activeTab, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/api/reports/${activeTab}?${params.toString()}`);
      return res.data.data;
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 print-p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
          <p className="text-gray-500">تحليل أداء العيادة</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-gray-300 rounded-lg shadow-sm focus:border-rose-500 focus:ring-rose-500"
          />
          <span className="text-gray-500">إلى</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-gray-300 rounded-lg shadow-sm focus:border-rose-500 focus:ring-rose-500"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Printer size={18} />
            طباعة
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 no-print">
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'financial' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          التقرير المالي
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'services' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          تقرير الخدمات والجلسات
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'clients' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          تقرير العملاء
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><span className="text-rose-500 font-medium">جاري إعداد التقرير...</span></div>
      ) : (
        <div className="space-y-6">
          {/* Header for printing */}
          <div className="hidden print-only text-center mb-8 pb-4 border-b">
            <h2 className="text-2xl font-bold">باتشي كلينك - التقرير {
              activeTab === 'financial' ? 'المالي' : activeTab === 'services' ? 'للخدمات' : 'للعملاء'
            }</h2>
            <p className="text-gray-600">الفترة من: {startDate || 'بداية النظام'} إلى {endDate || 'اليوم'}</p>
          </div>

          {activeTab === 'financial' && reportData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 font-medium">إجمالي الإيرادات</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(reportData.totalRevenue)}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 font-medium">إجمالي المصروفات</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(reportData.totalExpenses)}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm bg-rose-50">
                  <p className="text-sm text-rose-600 font-medium">صافي الربح</p>
                  <h3 className="text-2xl font-bold text-rose-700 mt-2">{formatCurrency(reportData.netProfit)}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-4">أعلى العملاء إنفاقاً</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-gray-50 text-gray-600 font-medium">
                        <tr>
                          <th className="py-3 px-4 rounded-r-lg">الاسم</th>
                          <th className="py-3 px-4 rounded-l-lg">إجمالي الإنفاق</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportData.topClients.map((client: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{client.name}</td>
                            <td className="py-3 px-4 text-emerald-600 font-bold">{formatCurrency(client.spent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-4">المصروفات حسب التصنيف</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.expensesByCategory}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="amount"
                          nameKey="category"
                        >
                          {reportData.expensesByCategory.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'services' && reportData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 font-medium">إجمالي الجلسات</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{reportData.totalSessions}</h3>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-4">استهلاك الأجهزة (نبضات)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                      <tr>
                        <th className="py-3 px-4 rounded-r-lg">الجهاز</th>
                        <th className="py-3 px-4 rounded-l-lg">إجمالي النبضات المستهلكة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.deviceUtilization.map((device: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-3 px-4 font-medium">{device.device}</td>
                          <td className="py-3 px-4 text-rose-600 font-bold">{device.pulses?.toLocaleString() || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'clients' && reportData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 font-medium">إجمالي العملاء</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{reportData.totalClients}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 font-medium">العملاء الجدد (في الفترة المحددة)</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{reportData.newClients}</h3>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
