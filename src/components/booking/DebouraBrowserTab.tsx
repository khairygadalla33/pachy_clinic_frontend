import { useState } from 'react';

export default function DebouraBrowserTab() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-full h-[calc(100vh-65px)] bg-slate-50 overflow-hidden flex flex-col">
      {/* Smooth Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-bold text-slate-800">جاري فتح متجر ديبورا كوزموتكس...</p>
          <p className="text-xs text-purple-600 mt-1 font-semibold">تصفحي المنتجات والعروض الحصرية</p>
        </div>
      )}

      {/* Embedded In-App Store Iframe without top-navigation hijack */}
      <iframe
        src="/deboura-store/"
        title="Deboura Cosmetics Store"
        className="w-full flex-1 border-0"
        onLoad={() => setLoading(false)}
        allow="camera; microphone; geolocation; payment; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
      />
    </div>
  );
}
