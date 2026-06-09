"use client";

import { format } from "date-fns";
import Image from "next/image";
import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { AlertCircle, Loader2, Reply, Check, X, MessageCircle, Trash } from "lucide-react";

import MessageMenu from "./MessageMenu";
import type { Message } from "@/lib/types/chat";
import { addReaction, editMessage, removeReaction } from "@/lib/client/api/messages";
import Link from "next/link";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "../ui/dialog";
import { deleteThread } from "@/lib/server/actions/threads";

type ChatItemVariant = "channel" | "thread-parent" | "thread-reply";

type ChatItemProps = {
  message: Message;
  serverId: string;
  handleDelete?: (id: string) => void;
  onCreateThread?: (message: Message) => void;
  onEdit?: (id: string, content: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  variant?: ChatItemVariant;
  currentUser: string
  hasPermissionManageMessages: boolean
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
    <Image width={300} height={300} src={src} className="max-w-75 rounded" alt="attachment" />
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
        <p className="whitespace-pre-wrap wrap-break-word text-sm text-gray-300">
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

function ReactionBar({
  reactions,
  currentUserId,
  onToggle,
}: {
  reactions: Message["reactions"];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}) {
  if (!reactions || reactions.length === 0) return null;

  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, self: false };
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) acc[r.emoji].self = true;
    return acc;
  }, {} as Record<string, { count: number; self: boolean }>);

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, { count, self }]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onToggle(emoji)}
          className={`
            flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
            transition-colors cursor-pointer
            ${self
              ? "bg-discord-blue/20 border border-discord-blue/40 text-white"
              : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
            }
          `}
        >
          <span>{emoji}</span>
          <span className="text-[11px] font-medium">{count}</span>
        </button>
      ))}
    </div>
  );
}

function ChatItem({
  message,
  serverId,
  handleDelete,
  onEdit,
  onToggleReaction,
  currentUser,
  variant = "channel",
  hasPermissionManageMessages
}: ChatItemProps) {
  const isFailed = message._status === "failed";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);

  const [isWithinEditWindow, setIsWithinEditWindow] = useState(() => {
    const createdAt = new Date(message.created_at).getTime();
    const remaining = 5 * 60 * 1000 - (Date.now() - createdAt);
    return remaining > 0;
  });

  useEffect(() => {
    const createdAt = new Date(message.created_at).getTime();
    const remaining = 5 * 60 * 1000 - (Date.now() - createdAt);

    if (remaining <= 0) return; // already outside edit window

    const timer = window.setTimeout(() => {
      setIsWithinEditWindow(false);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [message.created_at]);

  const canEdit = !isFailed && message.user_id === currentUser && isWithinEditWindow;


  const handleToggleReaction = useCallback(
    async (emoji: string) => {
      if (!onToggleReaction) return;
      const hasReacted = message.reactions?.some(
        (r) => r.user_id === currentUser && r.emoji === emoji,
      );
      try {
        if (hasReacted) {
          await removeReaction({ message_id: message.id, emoji });
        } else {
          await addReaction({ message_id: message.id, emoji });
        }
        onToggleReaction(message.id, emoji);
      } catch (e) {
        alert(e)
      }
    },
    [currentUser, message.id, message.reactions, onToggleReaction],
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editContent.trim() || editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await editMessage({
        id: message.id,
        content: editContent.trim(),
        channel_id: message.channel_id,
        server_id: serverId
      });
      onEdit?.(message.id, editContent.trim());
      setIsEditing(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to edit message");
    } finally {
      setIsSaving(false);
    }
  }, [editContent, message.content, message.id, message.channel_id, serverId, onEdit]);

  const handleCancelEdit = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(false);
  }, [message.content]);

  return (
    <div
      id={message.id}
      data-chat-item
      data-chat-item-variant={variant}
      className={`group relative px-4 py-1 transition-colors rounded-md hover:bg-white/5 ${isFailed ? "opacity-60" : ""
        }`}
    >
      {message.parent_content && (
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

          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === "Escape") {
                    handleCancelEdit();
                  }
                }}
                className="w-full min-h-15 px-3 py-2 text-sm bg-black/40 text-gray-200 rounded-md border border-white/10 focus:outline-none focus:border-discord-blue resize-none"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-discord-blue text-white rounded hover:bg-discord-blue/90 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-surface-raised text-gray-300 rounded hover:bg-surface-hover disabled:opacity-50"
                >
                  <X size={12} />
                  Cancel
                </button>
                <span className="text-[10px] text-gray-500">press enter to save, esc to cancel</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <MessageContent message={message} />
              {(message?.threads || []).map(t => (
                <Link
                  className="text-secondary text-sm f mt-1 flex items-center justify-between"
                  href={`/${serverId}/${message.channel_id}/${t.id}`}
                  key={t.id}>
                  <div className="flex items-center gap-1 text-xs text-green-500">
                    <MessageCircle size={15} />
                    {t.name}
                  </div>

                  {hasPermissionManageMessages && (

                    <Dialog>
                      <DialogTrigger title="Delete Thread"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();

                          e.stopPropagation()
                        }}>
                        <Trash size={15} color="red" />
                      </DialogTrigger>
                      <DialogContent showCloseButton={false} className="bg-sidebar-secondary text-white shadow">
                        <DialogTitle className="text-sm font-normal">
                          Are you sure you want to delete this thread? This action cannot be undone.
                        </DialogTitle>

                        <div className="mt-4 flex justify-end gap-2">
                          <DialogClose
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation()
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-surface-raised text-gray-300 rounded hover:bg-surface-hover"

                          >
                            <X size={12} />
                            Cancel
                          </DialogClose>
                          <button
                            className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              try {
                                await deleteThread(t.id, serverId).then(() => {
                                  alert("Thread deleted successfully")

                                })
                              }
                              catch (error) {
                                console.error("Failed to delete thread", error);
                                alert("Failed to delete thread");
                              }
                            }}
                          >
                            <Trash size={12} />
                            Delete
                          </button>
                        </div>
                      </DialogContent>
                    </Dialog>

                  )}


                </Link>
              ))}
              <ReactionBar
                reactions={message.reactions}
                currentUserId={currentUser}
                onToggle={handleToggleReaction}
              />
            </div>
          )}

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

        {!isFailed && (
          <MessageMenu
            hasPermissionManageMessages={hasPermissionManageMessages}
            currentUser={currentUser}
            message={message}
            serverId={serverId}
            onDelete={handleDelete ?? (() => { })}
            onEdit={canEdit ? () => setIsEditing(true) : undefined}
            onToggleReaction={handleToggleReaction}
          />
        )}
      </div>
    </div>
  );
}

export default memo(ChatItem);
