import { useState } from 'react';
import { RefreshCw, FolderOpen, Users, X, Save } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function WhatsAppContactsTab() {
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
  const { data: segments } = useQuery({
    queryKey: ['wa-segments'],
    queryFn: () => api.get('/whatsapp/segments').then(r => r.data)
  });

  const groups = [
    { id: 'total', name: 'إجمالي العملاء', count: segments?.total || 0, contacts: [] },
    { id: 'vip', name: 'عملاء VIP (أكثر من 10k)', count: segments?.vip || 0, contacts: [] },
    { id: 'laser', name: 'عملاء عيادة الليزر', count: segments?.laser || 0, contacts: [] },
    { id: 'packages', name: 'عملاء الباقات النشطة', count: segments?.packages || 0, contacts: [] },
  ];

  return (
    <div className="space-y-6 relative h-[800px]">
      {/* Header */}
      <div className="bg-surface-50 p-5 rounded-xl border border-surface-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-surface-800">شرائح العملاء (Segments)</h2>
          <p className="text-xs text-surface-500 mt-1">يتم احتساب أعداد العملاء في كل شريحة بناءً على التاريخ الطبي والمالي من السجلات.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="btn-primary bg-emerald-500 hover:bg-emerald-600 py-2 px-4 flex items-center gap-2 border-transparent">
            <RefreshCw className="w-4 h-4" /> مزامنة الآن
          </button>
        </div>
      </div>

      {/* Content - Folders Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {groups.map(group => (
          <button 
            key={group.id} 
            onClick={() => setSelectedGroup(group)}
            className="bg-white border border-surface-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all text-right group flex flex-col justify-between h-32"
          >
            <FolderOpen className="w-8 h-8 text-blue-500 mb-3" />
            
            <div>
              <h4 className="font-semibold text-surface-800 text-sm mb-1 truncate">{group.name}</h4>
              <div className="flex items-center gap-1.5 text-surface-500 text-xs">
                <Users className="w-3.5 h-3.5" />
                <span>{group.count} أرقام</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Overlay Modal for Selected Group */}
      {selectedGroup && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 rounded-xl backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-full">
            <div className="p-5 border-b border-surface-200 flex justify-between items-center">
              <input 
                type="text" 
                value={selectedGroup.name} 
                onChange={(e) => setSelectedGroup({...selectedGroup, name: e.target.value})}
                className="text-xl font-bold bg-transparent border-none focus:ring-0 p-0 w-1/2"
              />
              <div className="flex gap-2">
                <button className="btn-primary bg-emerald-500 hover:bg-emerald-600 py-1.5 px-4 flex items-center gap-2 border-transparent text-sm">
                  <Save className="w-4 h-4" /> حفظ الاسم
                </button>
                <button onClick={() => setSelectedGroup(null)} className="btn-secondary bg-surface-100 hover:bg-surface-200 py-1.5 px-3 border-transparent">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-5 flex-1 overflow-auto bg-surface-50">
              <table className="w-full text-sm text-right bg-white rounded-lg overflow-hidden border border-surface-200">
                <thead className="bg-surface-100 text-surface-600 font-semibold border-b border-surface-200">
                  <tr>
                    <th className="p-3">الاسم</th>
                    <th className="p-3">الرقم</th>
                    <th className="p-3">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {selectedGroup.contacts.length > 0 ? (
                    selectedGroup.contacts.map((contact: any) => (
                      <tr key={contact.id} className="hover:bg-surface-50">
                        <td className="p-3">{contact.name}</td>
                        <td className="p-3" dir="ltr">{contact.phone}</td>
                        <td className="p-3 text-surface-500">{contact.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-surface-500">
                        هذه القائمة فارغة حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
