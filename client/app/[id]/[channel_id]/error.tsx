"use client";

export default function ChannelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-(--discord-chat)">
      <h2 className="text-xl font-semibold text-white mb-2">
        Failed to load channel
      </h2>
      <p className="text-sm text-gray-400 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-discord-brand hover:bg-accent-blue text-white rounded-md transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
