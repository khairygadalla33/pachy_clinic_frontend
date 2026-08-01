import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Clock, Users, LogIn, CheckSquare, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import Card from '../components/Card';
import Badge from '../components/Badge';
import WorkflowQueuePanel from '../components/WorkflowQueuePanel';

export default function ReceptionDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const branchId = user?.branchId;

  // Polling queries
  const { data: stats } = useQuery({
    queryKey: ['workflow-stats', branchId],
    queryFn: () => api.get(`/workflow/stats?branchId=${branchId}`).then(r => r.data),
    refetchInterval: 10000,
    enabled: !!branchId,
  });

  const { data: doctorGroups } = useQuery({
    queryKey: ['workflow-queue', branchId],
    queryFn: () => api.get(`/workflow/queue/by-doctor?branchId=${branchId}`).then(r => r.data),
    refetchInterval: 10000,
    enabled: !!branchId,
  });

  const { data: upcoming } = useQuery({
    queryKey: ['appointments-upcoming', branchId],
    queryFn: () => api.get(`/appointments/today?branchId=${branchId}&status=PENDING,CONFIRMED`).then(r => r.data),
    refetchInterval: 30000,
    enabled: !!branchId,
  });

  // Action Mutation
  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api.put(`/workflow/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
    },
  });

  const handleAction = (itemId: string, action: string) => {
    actionMutation.mutate({ id: itemId, action });
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Reception Dashboard</h1>
          <p className="text-surface-500 text-sm mt-1">Live patient queue and workflow tracking</p>
        </div>
        <button onClick={() => navigate('/appointments?newWalkIn=true')} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Walk-in Patient
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Booked', value: stats?.BOOKED || 0, icon: Clock, color: 'text-surface-600 bg-surface-100 border border-surface-200' },
          { label: 'Arrived', value: stats?.ARRIVED || 0, icon: LogIn, color: 'text-yellow-600 bg-yellow-50 border border-yellow-200' },
          { label: 'In Prep', value: stats?.IN_PREP || 0, icon: Activity, color: 'text-orange-600 bg-orange-50 border border-orange-200' },
          { label: 'Waiting', value: stats?.WAITING || 0, icon: Users, color: 'text-red-600 bg-red-50 border border-red-200' },
          { label: 'In Session', value: stats?.IN_SESSION || 0, icon: Activity, color: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
          { label: 'Checkout', value: stats?.PENDING_CHECKOUT || 0, icon: CheckSquare, color: 'text-blue-600 bg-blue-50 border border-blue-200' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-xl shadow-sm ${s.color}`}>
            <div className="flex items-center gap-3">
              <s.icon className="w-6 h-6 opacity-75" />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium uppercase tracking-wider opacity-75">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Queue Panel */}
      <WorkflowQueuePanel 
        doctorGroups={doctorGroups || []} 
        onAction={handleAction} 
        onViewClient={handleViewClient} 
      />

      {/* Upcoming Appointments Table */}
      <Card title="Today's Upcoming Appointments">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 text-surface-600 border-b border-surface-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {upcoming?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-surface-500">
                    No upcoming appointments today.
                  </td>
                </tr>
              ) : (
                upcoming?.map((apt: any) => (
                  <tr key={apt.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-surface-900">{apt.startTime}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-surface-900">{apt.client.fullName}</div>
                      <div className="text-xs text-surface-500">{apt.client.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-surface-700">{apt.service.name}</td>
                    <td className="px-4 py-3 text-surface-700">Dr. {apt.staff.fullName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={apt.status === 'CONFIRMED' ? 'success' : 'warning'}>{apt.status}</Badge>
                    </td>
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
