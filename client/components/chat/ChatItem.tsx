"use client";

import { format } from "date-fns";
import Image from "next/image";
import { memo, useMemo } from "react";
import { AlertCircle, Loader2, Reply } from "lucide-react";

import MessageMenu from "./MessageMenu";
import type { Message } from "@/lib/types/chat";

type ChatItemVariant = "channel" | "thread-parent" | "thread-reply";

type ChatItemProps = {
  message: Message;
  serverId: string;
  handleDelete?: (id: string) => void;
  onCreateThread?: (message: Message) => void;
  variant?: ChatItemVariant;
};

type ReplyThreadProps = {
  parent_content: string | null;
  parent_msg_id: string | null;
  parent_username: string | null;
};

function ReplyThread({
  parent_content,
  parent_msg_id,
  parent_username,
}: ReplyThreadProps) {
  if (!parent_content || !parent_msg_id || !parent_username) return null;

  return (
    <a
      href={`#${parent_msg_id}`}
      className="mb-1 flex items-center gap-3 hover:underline"
    >
      <span className="ml-5 flex size-5 items-center justify-center rounded-full bg-sidebar-primary/50">
        <Reply size={12} className="text-white" />
      </span>

      <span className="text-xs font-medium text-green-500 hover:underline">
        {parent_username}
      </span>

      <span className="max-w-xs truncate text-xs font-medium text-white/70">
        {parent_content}
      </span>
    </a>
  );
}

type MessageContentProps = {
  message: Pick<Message, "image_url" | "content" | "_status">;
};

function AttachmentImage({
  src,
  status,
}: {
  src: string;
  status?: Message["_status"];
}) {
  const isBlob = src.startsWith("blob:");

  const img = isBlob ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} className="max-w-[300px] rounded" alt="attachment" />
  ) : (
    <Image
      className="rounded object-contain"
      src={src}
      width={300}
      height={300}
      alt="attachment"
      loading="lazy"
    />
  );

  if (status !== "uploading") return img;

  return (
    <div className="relative inline-block">
      <div className="opacity-50">{img}</div>

      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-white drop-shadow" />
      </div>
    </div>
  );
}

function MessageContent({ message }: MessageContentProps) {
  const hasImage = Boolean(message.image_url);
  const hasContent = Boolean(message.content?.trim());

  if (!hasImage && !hasContent) {
    return null;
  }

  return (
    <div className="space-y-1">
      {message.image_url && (
        <AttachmentImage src={message.image_url} status={message._status} />
      )}

      {hasContent && (
        <p className="whitespace-pre-wrap break-words text-sm text-gray-300">
          {message.content}
        </p>
      )}
    </div>
  );
}

type MessageHeaderProps = {
  username: string;
  isBot: boolean;
  created_at: string;
};

function MessageHeader({ username, isBot, created_at }: MessageHeaderProps) {
  const formattedTime = useMemo(() => {
    const date = new Date(created_at);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return format(date, "h:mm a");
  }, [created_at]);

  return (
    <div className="flex items-center gap-2">
      <span className="cursor-pointer text-sm font-semibold text-white hover:underline">
        {username}
      </span>

      {isBot && (
        <span className="rounded bg-indigo-500 px-1 text-[10px] font-medium text-white">
          BOT
        </span>
      )}

      {formattedTime && (
        <span className="text-[11px] text-gray-400">{formattedTime}</span>
      )}
    </div>
  );
}

function ChatItem({
  message,
  serverId,
  handleDelete,
  onCreateThread,
  variant = "channel",
}: ChatItemProps) {
  const isFailed = message._status === "failed";

  const canCreateThread =
    variant === "channel" && !isFailed && Boolean(onCreateThread);

  const canDelete =
    !isFailed && Boolean(handleDelete) && variant !== "thread-parent";

  const showMenu = !isFailed && (canCreateThread || canDelete);

  return (
    <div
      id={message.id}
      data-chat-item
      data-chat-item-variant={variant}
      className={`group relative px-4 py-1 transition-colors hover:bg-white/5 ${isFailed ? "opacity-60" : ""
        }`}
    >
      {variant !== "thread-parent" && (
        <ReplyThread
          parent_content={message.parent_content}
          parent_msg_id={message.parent_msg_id}
          parent_username={message.parent_username}
        />
      )}

      <div className="flex items-start gap-3">
        {message.avatar ? (
          <Image
            src={message.avatar}
            alt={message.username}
            width={40}
            height={40}
            className="mt-0.5 size-9 shrink-0 rounded-full"
            loading="lazy"
          />
        ) : (
          <div className="mt-0.5 flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {message.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <MessageHeader
            username={message.username}
            isBot={false}
            created_at={message.created_at}
          />

          <MessageContent message={message} />

          {isFailed && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle size={12} />
              <span>Failed to send.</span>

              <button
                type="button"
                onClick={() => handleDelete?.(message.id)}
                className="underline transition-colors hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {showMenu && (
          <MessageMenu
            message={message}
            serverId={serverId}
            onDelete={() => { }}
            onCreateThread={
              canCreateThread ? () => onCreateThread?.(message) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

export default memo(ChatItem);
