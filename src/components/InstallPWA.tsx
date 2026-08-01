import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if event already fired
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    }

    const handler = () => {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    };

    window.addEventListener('pwa-prompt-ready', handler);

    return () => {
      window.removeEventListener('pwa-prompt-ready', handler);
    };
  }, []);

  if (!deferredPrompt) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="px-4 pb-4">
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium shadow-sm"
      >
        <Download size={18} />
        <span>تثبيت التطبيق (PWA)</span>
      </button>
    </div>
  );
}
