export default function ComingSoon({ title }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <h2 className="text-3xl font-semibold text-gray-800 mb-4">{title || 'Coming Soon'}</h2>
      <p className="text-gray-500 max-w-md text-center mb-8">
        This feature is currently under development. Stay tuned for updates in the upcoming phases.
      </p>
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-rose-200 h-10 w-10"></div>
        <div className="flex-1 space-y-6 py-1">
          <div className="h-2 bg-rose-200 rounded w-24"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-2 bg-rose-200 rounded col-span-2"></div>
              <div className="h-2 bg-rose-200 rounded col-span-1"></div>
            </div>
            <div className="h-2 bg-rose-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
