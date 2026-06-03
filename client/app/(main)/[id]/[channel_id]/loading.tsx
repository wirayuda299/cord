export default function Loading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-max">
      <div className="flex items-center h-14 animate-pulse gap-2 px-4 py-3 border-b border-white/10">
        <div className="skeleton w-4 h-4 rounded" />
        <div className="skeleton w-20 h-3 rounded" />
      </div>

      <div className="flex flex-col justify-center flex-1 pb-2 animate-pulse">
        {[85, 50, 75, 60, 80].map((width, i) => (
          <div key={i} className="flex gap-3 px-4 py-2">
            <div className="skeleton w-10 h-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 pt-0.5">
              <div
                className="skeleton h-3 rounded"
                style={{ width: 90 }}
              />
              <div
                className="skeleton h-2.5 rounded"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mx-4 mb-10 border border-white/20 rounded-lg px-3 py-2.5">
        <div className="skeleton h-3 w-40 rounded" />
      </div>
    </div>
  );
}
