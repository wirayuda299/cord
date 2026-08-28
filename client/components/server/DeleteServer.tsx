"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteServer } from "@/lib/actions/servers";

type DeleteServerProps = {
  serverId: string;
  serverName: string;
};

export default function DeleteServer({ serverId, serverName }: DeleteServerProps) {
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isMatched = confirmName.trim() === serverName.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched || loading) return;

    setLoading(true);
    setError(null);

    const res = await deleteServer(serverId);
    if (res && !res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }

    router.push("/direct-messages");
    router.refresh();
  };

  return (
    <div className="flex flex-col w-full max-h-screen overflow-y-auto text-white p-3 lg:p-8 min-w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-8">
        <div className="flex items-center justify-center size-10 rounded-xl bg-destructive/15">
          <Trash2 size={20} className="text-destructive" />
        </div>
        <div>
          <h2 className="font-semibold text-xl">Delete '{serverName}'</h2>
          <p className="text-xs md:text-sm text-text-dim mt-0.5">
            Permanently delete this server and all its contents
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 max-w-full">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive-foreground">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-red-300">
            <span className="font-bold text-red-200">Warning:</span> This action is irreversible. Deleting the server will permanently delete all channels, messages, roles, and files. Active WebSocket connections will be evicted immediately.
          </div>
        </div>

        <form onSubmit={handleDelete} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Enter Server Name
            </label>
            <p className="text-xs text-text-dim mb-1">
              Please type <span className="font-semibold text-white select-all">'{serverName}'</span> to confirm.
            </p>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Enter server name..."
              disabled={loading}
              className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:border-destructive/60 outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={!isMatched || loading}
              className="flex items-center justify-center gap-2 cursor-pointer md:px-4 px-2.5 py-2.5 rounded-lg text-xs md:text-sm font-semibold bg-destructive hover:bg-destructive-hover disabled:opacity-50 disabled:hover:bg-destructive text-white transition-all min-w-32"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Delete Server"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
