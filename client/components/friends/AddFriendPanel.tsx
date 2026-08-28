"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useEffect, useState } from "react";

import { findUsersByName, Friend } from "@/lib/client/api/users";
import { sendFriendRequest } from "@/lib/server/actions/friends";

function useDebouncedValue<T>(value: T, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

type SendFriendRequestArg = {
  userId: string;
};

async function sendFriendRequestMutation(
  _key: string,
  { arg }: { arg: SendFriendRequestArg },
) {
  const result = await sendFriendRequest(arg.userId);

  if (!result.success) {
    throw new Error(result.message);
  }

  return result;
}

export default function AddFriendPanel() {
  const [query, setQuery] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const shouldSearch = debouncedQuery.length >= 3;

  const {
    data: users = [],
    error: searchError,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<Friend[]>(
    shouldSearch ? ["users/search", debouncedQuery] : null,
    () => findUsersByName(debouncedQuery),
    {
      keepPreviousData: false,
      revalidateOnFocus: false,
    },
  );

  const { trigger: triggerSendFriendRequest, error: sendError } =
    useSWRMutation("friends/send-request", sendFriendRequestMutation);

  const handleSendFriendRequest = async (user: Friend) => {
    if (sendingId) return;

    if (user.friend_status !== "") {
      return;
    }

    setSendingId(user.id);

    try {

      const res = await triggerSendFriendRequest({ userId: user.id })
      if (!res.success) {
        alert(res.message)
        return
      }

      await mutate(
        (currentUsers) =>
          currentUsers?.map((currentUser) =>
            currentUser.id === user.id
              ? { ...currentUser, friend_status: "pending" }
              : currentUser,
          ),
        {
          revalidate: false,
        },
      );
    } finally {
      setSendingId(null);
    }
  };

  const isSearching = shouldSearch && (isLoading || isValidating);
  const errorMessage =
    searchError instanceof Error
      ? searchError.message
      : sendError instanceof Error
        ? sendError.message
        : null;

  return (
    <div className="block max-w-xl">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-text-bright">
            Add Friend
          </h3>
          <p className="mt-0.5 text-sm text-zinc-500">
            Search by username and send a friend request.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-bg-input px-3 py-2.5 transition-colors focus-within:border-discord-brand">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="text"
            required
            autoComplete="off"
            minLength={3}
            maxLength={50}
            placeholder="Enter a username..."
            className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>

        {query.trim().length > 0 && query.trim().length < 3 && (
          <p className="text-sm text-zinc-500">
            Username must be at least 3 characters.
          </p>
        )}

        {errorMessage && (
          <p className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {errorMessage}
          </p>
        )}

        {isSearching && (
          <p className="text-sm text-zinc-500">Searching users...</p>
        )}

        {!isSearching &&
          shouldSearch &&
          users.length === 0 &&
          !searchError && (
            <p className="text-sm text-zinc-500">No users found.</p>
          )}

        <div className="flex flex-col gap-1">
          {users.map((user) => {
            const isSending = sendingId === user.id;

            const isDisabled =
              isSending ||
              user.friend_status === "pending" ||
              user.friend_status === "blocked" ||
              user.friend_status === "accepted";

            let buttonLabel = "Send request";

            if (isSending) buttonLabel = "Sending...";
            else if (user.friend_status === "pending")
              buttonLabel = "Sent";
            else if (user.friend_status === "accepted")
              buttonLabel = "Friends";
            else if (user.friend_status === "blocked")
              buttonLabel = "Blocked";

            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-zinc-900"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-semibold text-zinc-200">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user.name.slice(0, 1).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-zinc-100">
                      {user.name}
                    </h3>
                    <p className="truncate text-xs text-zinc-500">
                      @{user.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSendFriendRequest(user)}
                  className="shrink-0 cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  {buttonLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
