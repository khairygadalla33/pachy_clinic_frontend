import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

import { formatCurrency } from '../lib/utils';
import { 
  Users, Calendar, Wallet, TrendingUp, Package, AlertTriangle, Activity 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af'];

interface AdminStats {
  todayRevenue: number;
  todayExpenses: number;
  todayNetProfit: number;
  monthRevenue: number;
  totalClients: number;
  newClientsThisMonth: number;
  todayAppointments: number;
  pendingInvoices: number;
  activePackages: number;
  lowStockProducts: number;
  deviceAlerts: number;
  revenueByDay: { date: string; amount: number }[];
  topServices: { name: string; count: number }[];
  revenueByPaymentMethod: { method: string; amount: number }[];
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const res = await api.get('/dashboard/admin');
      return res.data.data;
    }
  });

  if (isLoading) return <div className="p-6">جاري التحميل...</div>;
  if (error || !stats) return <div className="p-6 text-red-500">حدث خطأ في جلب البيانات</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-start">
        
        <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 no-print">
          طباعة التقرير
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">إيرادات اليوم</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">صافي الربح (اليوم)</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayNetProfit)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">مواعيد اليوم</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">إجمالي العملاء</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalClients}</h3>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center justify-start">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500" />
            <span className="font-medium text-orange-800">تنبيهات المخزون</span>
          </div>
          <span className="text-xl font-bold text-orange-600">{stats.lowStockProducts}</span>
        </div>
        
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-start">
          <div className="flex items-center gap-3">
            <Activity className="text-red-500" />
            <span className="font-medium text-red-800">صيانة الأجهزة</span>
          </div>
          <span className="text-xl font-bold text-red-600">{stats.deviceAlerts}</span>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-start">
          <div className="flex items-center gap-3">
            <Package className="text-purple-500" />
            <span className="font-medium text-purple-800">باقات نشطة</span>
          </div>
          <span className="text-xl font-bold text-purple-600">{stats.activePackages}</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-rose-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">الإيرادات (آخر 7 أيام)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueByDay}>
                <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#9ca3af" />
                <YAxis tickFormatter={(val) => `${val} ج`} tick={{fontSize: 12}} stroke="#9ca3af" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Services & Payments */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">طرق الدفع</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.revenueByPaymentMethod}
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="method"
                  >
                    {stats.revenueByPaymentMethod.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">توزيع الجلسات</h3>
            <div className="space-y-3">
              {stats.topServices.map((service, idx) => (
                <div key={idx} className="flex items-center justify-start">
                  <span className="text-sm font-medium text-gray-700">{service.name}</span>
                  <span className="text-sm font-bold text-rose-600">{service.count} جلسة</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
