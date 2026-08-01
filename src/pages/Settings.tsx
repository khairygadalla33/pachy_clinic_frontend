import { useState } from 'react';
import ComingSoon from '../components/ComingSoon';
import { 
  Building2, 
  MessageSquare, 
  FileText, 
  FlaskConical,
  Info
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
    { id: 'info', name: 'Clinic Info', icon: Info },
    { id: 'branches', name: 'Branches', icon: Building2 },
    { id: 'whatsapp', name: 'WhatsApp API', icon: MessageSquare },
    { id: 'templates', name: 'Prescription Templates', icon: FileText },
    { id: 'kits', name: 'Consumable Kits', icon: FlaskConical },
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
        {activeTab === 'info' && <ComingSoon title="Clinic Info Settings" />}
        {activeTab === 'branches' && <ComingSoon title="Branch Management" />}
        {activeTab === 'whatsapp' && <ComingSoon title="WhatsApp API Configuration" />}
        {activeTab === 'templates' && <ComingSoon title="Prescription Templates" />}
        {activeTab === 'kits' && <ComingSoon title="Consumable Kits" />}
      </div>
    </div>
  );
}
