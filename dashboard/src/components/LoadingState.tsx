'use client';

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-dark-card border border-dark-border rounded-xl" />
        ))}
      </div>

      {/* Table */}
      <div className="h-48 bg-dark-card border border-dark-border rounded-xl mb-6" />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="h-72 bg-dark-card border border-dark-border rounded-xl" />
        <div className="h-72 bg-dark-card border border-dark-border rounded-xl" />
      </div>

      {/* Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-dark-card border border-dark-border rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <p className="text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors"
        >
          Повторить
        </button>
      )}
    </div>
  );
}
