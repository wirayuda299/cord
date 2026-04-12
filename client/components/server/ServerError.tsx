export default function ServerError() {
   return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-base relative overflow-hidden">
         <div
            className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
         />

         <div className="relative z-10 text-center max-w-md px-6">
            <div className="relative w-24 h-24 mx-auto mb-7">
               {[0, 0.8, 1.6].map((delay, i) => (
                  <div
                     key={i}
                     className="absolute inset-0 rounded-full border-2 border-error/20 animate-ping"
                     style={{ animationDelay: `${delay}s`, animationDuration: "2.4s" }}
                  />
               ))}
               <div className="absolute inset-0 rounded-full bg-bg-input border border-error/25 flex items-center justify-center z-10">
                  <svg
                     className="text-error"
                     width="38"
                     height="38"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="1.6"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                  >
                     <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                     <line x1="12" y1="9" x2="12" y2="13" />
                     <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
               </div>
            </div>

            <p className="text-[11px] font-bold text-error tracking-[0.12em] uppercase mb-2.5 opacity-90">
               Error 503 · Service Unavailable
            </p>

            <h2 className="text-[22px] font-bold text-text-bright mb-2.5 leading-snug tracking-tight">
               This server hit a wall
            </h2>

            <p className="text-[13.5px] text-text-muted leading-relaxed mb-7">
               We couldn't connect to{" "}
               <strong className="text-text-dim">my-server</strong>. The server
               may be temporarily down, under maintenance, or experiencing an outage.
            </p>

            <div className="inline-flex items-center gap-1.5 bg-bg-input border border-surface-raised rounded-md px-3.5 py-2 font-mono text-[12px] text-text-placeholder mb-7">
               <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
               gateway.myserver.io · timeout after 30s
            </div>

            <div className="flex items-center justify-center gap-2.5">
               <button className="bg-discord-brand hover:bg-accent-blue text-white text-[13.5px] font-semibold px-5 py-2.5 rounded border-none cursor-pointer transition-colors">
                  Try reconnecting
               </button>
               <button className="bg-transparent hover:bg-surface-subtle text-text-dim hover:text-text-primary text-[13.5px] font-medium px-5 py-2.5 rounded border border-surface-hover cursor-pointer transition-colors">
                  Report issue
               </button>
            </div>
         </div>
      </div>
   );
}
