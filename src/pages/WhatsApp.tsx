import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Badge from '../components/Badge';
import { CheckCircle2, Megaphone, Settings, Plug, MessageSquare, Users, MessageCircle } from 'lucide-react';

import WhatsAppConnectionTab from '../components/whatsapp/WhatsAppConnectionTab';
import WhatsAppFeaturesTab from '../components/whatsapp/WhatsAppFeaturesTab';
import WhatsAppBroadcastTab from '../components/whatsapp/WhatsAppBroadcastTab';
import WhatsAppLogsTab from '../components/whatsapp/WhatsAppLogsTab';
import WhatsAppChatwootTab from '../components/whatsapp/WhatsAppChatwootTab';
import WhatsAppContactsTab from '../components/whatsapp/WhatsAppContactsTab';

export default function WhatsApp() {
  const [activeTab, setActiveTab] = useState('connection');
  
  const { data: status } = useQuery({ 
    queryKey: ['wa-status'], 
    queryFn: () => api.get('/whatsapp/status').then(r => r.data) 
  });
  
  const { data: instances = [] } = useQuery({ 
    queryKey: ['wa-instances'], 
    queryFn: () => api.get('/whatsapp/instances').then(r => r.data) 
  });

  const TabButton = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md border ${
          isActive 
            ? 'bg-emerald-500 text-white border-emerald-500 font-semibold shadow-sm' 
            : 'bg-white text-emerald-600 border-surface-300 hover:bg-emerald-50 hover:border-emerald-500'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-surface-200">
        <div className="flex items-center gap-3">
          <img src="/whatsapp-main-icon.png" alt="WhatsApp" className="w-8 h-8" onError={(e) => { e.currentTarget.style.display='none'; }} />
          <h1 className="text-xl font-bold text-emerald-600">نظام واتساب</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {status?.connected ? (
            <Badge variant="success" className="text-sm py-1.5 px-3">
              <CheckCircle2 className="w-4 h-4 mr-1 inline-block"/> متصل بـ {status.instances?.length || 0} أرقام
            </Badge>
          ) : (
            <Badge variant="danger" className="text-sm py-1.5 px-3">غير متصل</Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 rtl:space-x-reverse">
        <TabButton id="connection" icon={Plug} label="إعدادات الاتصال" />
        <TabButton id="features" icon={Settings} label="إعدادات الواتساب" />
        <TabButton id="broadcast" icon={Megaphone} label="حملات البرودكاست" />
        <TabButton id="logs" icon={MessageSquare} label="سجل الرسائل" />
        <TabButton id="chatwoot" icon={MessageCircle} label="Chatwoot" />
        <TabButton id="contacts" icon={Users} label="جهات الاتصال" />
      </div>

      <div className="mt-4">
        {activeTab === 'connection' && <WhatsAppConnectionTab instances={instances} status={status} />}
        {activeTab === 'features' && <WhatsAppFeaturesTab instances={instances} />}
        {activeTab === 'broadcast' && <WhatsAppBroadcastTab instances={instances} />}
        {activeTab === 'logs' && <WhatsAppLogsTab />}
        {activeTab === 'chatwoot' && <WhatsAppChatwootTab />}
        {activeTab === 'contacts' && <WhatsAppContactsTab />}
      </div>
    </div>
  );
}
