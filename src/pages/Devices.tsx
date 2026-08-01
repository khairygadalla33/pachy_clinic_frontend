
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Activity, Wrench, AlertTriangle } from 'lucide-react';

const fetchDevices = async () => {
  const { data } = await api.get('/devices');
  return data;
};

const fetchAlerts = async () => {
  const { data } = await api.get('/devices/alerts');
  return data;
};

const Devices = () => {
  const { data: devices, isLoading: devLoading } = useQuery({ queryKey: ['devices'], queryFn: fetchDevices });
  const { data: alerts, isLoading: alertLoading } = useQuery({ queryKey: ['device-alerts'], queryFn: fetchAlerts });

  if (devLoading || alertLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">إدارة الأجهزة</h1>
      </div>

      {alerts && alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> تنبيهات الأجهزة ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alerts.map((alert: any, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-red-800">
                  <Badge variant="destructive" className="text-xs">
                    {alert.type === 'PULSE_WARNING' ? 'تنبيه نبضات' : 'تنبيه صيانة'}
                  </Badge>
                  {alert.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices?.data?.map((device: any) => {
          const percent = device.maxPulseCount 
            ? Math.round(((device.totalPulseCount || 0) / device.maxPulseCount) * 100) 
            : 0;
            
          return (
            <Card key={device.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{device.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{device.model || 'لا يوجد موديل'}</p>
                </div>
                <Activity className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {device.maxPulseCount && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>استهلاك النبضات</span>
                        <span className="font-bold">{percent}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${percent >= 80 ? 'bg-red-500' : percent >= 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-left">
                        {device.totalPulseCount?.toLocaleString('en-US')} / {device.maxPulseCount?.toLocaleString('en-US')}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 flex justify-between border-t border-border">
                    <Button variant="outline" size="sm">
                      <Wrench className="w-4 h-4 ml-1" /> سجل الصيانة
                    </Button>
                    <Badge variant={device.isActive ? 'success' : 'secondary'}>
                      {device.isActive ? 'يعمل' : 'معطل'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {devices?.data?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            لا توجد أجهزة مسجلة
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Devices;
