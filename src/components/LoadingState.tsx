export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border border-outline-variant bg-surface-container-lowest p-4">
          <div className="skel h-4 w-24" />
          <div className="skel mt-3 h-6 w-40" />
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="skel h-10 w-full" />
            <div className="skel h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
