import { useState } from 'react';
import { RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

export default function DebouraBrowserTab() {
  const [iframeKey, setIframeKey] = useState(1);
  const [loading, setLoading] = useState(true);

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open('https://www.deboura.com', '_blank');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-slate-100 font-cairo dir-rtl">
      {/* In-App Browser Control Bar */}
      <div className="bg-white px-4 py-2.5 border-b border-slate-200 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src="/deboura-logo.png"
            alt="Deboura Cosmetics"
            className="h-8 w-auto object-contain"
          />
          <div>
            <h2 className="text-xs font-bold text-slate-800 leading-none">متجر ديبورا كوزموتكس</h2>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-sans mt-0.5" dir="ltr">
              <ShieldCheck className="w-3 h-3" />
              <span>https://www.deboura.com</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            title="إعادة تحميل المتجر"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} />
          </button>
          <button
            onClick={handleOpenExternal}
            title="فتح في متصفح خارجي"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div className="relative flex-1 w-full bg-white overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold text-slate-700">جاري فتح متجر ديبورا كوزموتكس...</p>
            <p className="text-xs text-slate-400 mt-1">تصفحي أحدث منتجات العناية بالبشرة والمكياج</p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src="https://www.deboura.com"
          title="Deboura Cosmetics Store"
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          allow="camera; microphone; geolocation"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
        />
      </div>
    </div>
  );
}
