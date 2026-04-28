"use client";

import { cancelFriendRequest, getAllPendingRequest } from "@/lib/client/api/friends";
import { Check, X, Clock } from "lucide-react";
import Image from "next/image";
import useSWR from "swr";


function Avatar({ name, avatarURL }: { name: string, avatarURL: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-discord-brand/70 flex items-center justify-center text-sm font-bold text-white shrink-0">
      {avatarURL ? (
        <Image src={avatarURL} width={36} height={36} alt={name} />
      ) : name.toUpperCase().charAt(0)}
    </div>
  );
}

export default function PendingRequests() {
  const { data: pendingRequests = [], isLoading, mutate } = useSWR(
    "/api/friends",
    getAllPendingRequest,
  );

  const incoming = pendingRequests?.filter((r) => r.addressee_user_id === "usr_001") ?? [];
  const outgoing = pendingRequests?.filter((r) => r.requester_user_id === "usr_001") ?? [];

  const cancel = async (id: string) => {
    try {

      await cancelFriendRequest(id).then(r => {
        console.log(r)
        mutate()
      })
    } catch (e) {
      alert(e)
    }
  };
  const acceptInvitationRequest = (id: string) => { }

  return (
    <phantom-ui loading={isLoading}>
      <div className="flex flex-col gap-6">
        {incoming.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Incoming — {incoming.length}
            </p>
            <ul className="space-y-1">
              {incoming.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-surface-hover group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={req.requester_username} avatarURL={req.requester_avatar_url} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-100 truncate">
                        {req.requester_username}
                      </p>
                      {/*<p className="text-xs text-zinc-500">
                                    {req.tag} · Incoming Friend Request
                                 </p>*/}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => acceptInvitationRequest(req.id)}
                      title="Accept"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-raised hover:bg-green-500/20 text-zinc-400 hover:text-green-400 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      title="Decline"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-raised hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {outgoing.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Outgoing — {outgoing.length}
            </p>
            <ul className="space-y-1">
              {outgoing.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-surface-hover group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">

                    <Avatar name={req.addressee_username} avatarURL={req.addressee_avatar_url} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-100 truncate">
                        {req.addressee_username}
                      </p>
                      {/*<p className="text-xs text-zinc-500">
                                    {req.tag} · Outgoing Friend Request
                                 </p>*/}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mr-1">
                      <Clock size={13} />
                      <span>Pending</span>
                    </div>
                    <button
                      onClick={() => cancel(req.id)}
                      title="Cancel"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-raised hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {incoming.length === 0 && outgoing.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center">
              <Check size={28} className="text-zinc-600" />
            </div>
            <p className="text-zinc-300 font-semibold">All caught up!</p>
            <p className="text-zinc-500 text-sm">
              No pending friend requests.
            </p>
          </div>
        )}
      </div>
    </phantom-ui>
  );
}
