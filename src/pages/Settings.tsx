import { useState } from 'react';

import { 
  Building2, 
  MessageSquare, 
  FileText, 
  FlaskConical,
  Info,
  UsersRound,
  CalendarClock
} from 'lucide-react';
import WhatsAppSettings from '../components/settings/WhatsAppSettings';
import ClinicInfoSettings from '../components/settings/ClinicInfoSettings';
import BranchSettings from '../components/settings/BranchSettings';
import PrescriptionTemplatesSettings from '../components/settings/PrescriptionTemplatesSettings';
import ConsumableKitsSettings from '../components/settings/ConsumableKitsSettings';
import DoctorScheduleSettings from '../components/settings/DoctorScheduleSettings';
import UserManagement from './UserManagement';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
    { id: 'info', name: 'بيانات العيادة', icon: Info },
    { id: 'branches', name: 'الفروع', icon: Building2 },
    { id: 'whatsapp', name: 'إعدادات واتساب', icon: MessageSquare },
    { id: 'schedules', name: 'إدارة المواعيد', icon: CalendarClock },
    { id: 'templates', name: 'قوالب الروشتات', icon: FileText },
    { id: 'kits', name: 'مجموعات المستهلكات', icon: FlaskConical },
    { id: 'users', name: 'المستخدمين', icon: UsersRound },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                  ${
                    activeTab === tab.id
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeTab === tab.id ? 'text-rose-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'info' && <ClinicInfoSettings />}
        { activeTab === 'branches' && <BranchSettings /> }
        { activeTab === 'whatsapp' && <WhatsAppSettings /> }
        { activeTab === 'schedules' && <DoctorScheduleSettings /> }
        { activeTab === 'templates' && <PrescriptionTemplatesSettings /> }
        { activeTab === 'kits' && <ConsumableKitsSettings /> }
        { activeTab === 'users' && <UserManagement /> }
      </div>
    </div>
  );
}
