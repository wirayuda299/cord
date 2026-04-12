"use client";

import { Plus, Smile, Gift, Sticker, X, ImageIcon } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebsocket";
import type { Message, ResponseMessage } from "@/lib/types/chat";
import { uploadImage } from "@/lib/server/actions/images";
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/shared/file-validation";
import { useAttachedFiles } from "@/hooks/useAttachedFiles";
import { FilePreview } from "./FilePreview";

type ChatFormProps = {
  channelName: string;
  serverId: string;
  channelId: string;
  handleMessages: (msg: ResponseMessage) => void;
  handleDelete?: (id: string) => void;
  parentMsgId: string | null;
  setSelectedMsg: (m: Message | null) => void;
  userId?: string;
};

export default function ChatForm({
  channelName,
  serverId,
  channelId,
  handleMessages,
  handleDelete,
  parentMsgId,
  setSelectedMsg,
  userId = "usr_001",
}: ChatFormProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { sendMessage } = useWebSocket(serverId, channelId, {
    onMessage: handleMessages,
    onDelete: handleDelete,
    onClose: () => console.log("disconnected"),
    onError: (e) => console.error("ws error", e),
  });

  const {
    attachedFiles,
    errors: fileErrors,
    addFiles,
    removeFile,
    clearFiles,
    clearErrors,
  } = useAttachedFiles();

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (attachedFiles.length <= 0 && !message.trim()) return;

    try {
      setIsSubmitting(true);

      let attachmentUrl = "";
      let attachmentId = "";

      if (attachedFiles.length > 0) {
        const res = await uploadImage(attachedFiles[0].file);
        attachmentUrl = res.url;
        attachmentId = res.public_id;
      }

      sendMessage({
        message: message || "",
        user_id: userId,
        attachment_url: attachmentUrl,
        attachment_id: attachmentId,
        ...(parentMsgId && { parent_message_id: parentMsgId }),
      });

      setMessage("");
      clearFiles();
      clearErrors();

      if (textareaRef.current) textareaRef.current.style.height = "auto";
      if (parentMsgId) setSelectedMsg(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    attachedFiles,
    message,
    sendMessage,
    userId,
    parentMsgId,
    setSelectedMsg,
    clearFiles,
    clearErrors,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    },
    [addFiles],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.items)
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter(Boolean) as File[];
      if (files.length > 0) addFiles(files);
    },
    [addFiles],
  );

  return (
    <div
      className="px-4 pb-6 pt-2 shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isSubmitting && <p className="text-sm text-white">Submitting...</p>}
      <input
        ref={fileInputRef}
        type="file"
        name="attachment"
        accept={ALLOWED_FILE_EXTENSIONS}
        className="hidden"
        onChange={(e) =>
          e.target.files && addFiles(Array.from(e.target.files))
        }
      />

      {fileErrors.length > 0 && (
        <div className="mb-2 flex flex-col gap-1">
          {fileErrors.map((err, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs px-3 py-2 rounded-lg"
            >
              <X size={12} />
              {err}
            </div>
          ))}
        </div>
      )}

      <div
        className={`flex flex-col  bg-surface-chat rounded-xl transition-colors ${isDragging ? "ring-2 ring-discord-brand bg-discord-brand/10" : ""
          }`}
      >
        {isDragging && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <ImageIcon size={32} className="text-blue-400" />
            <p className="text-blue-400 text-sm font-medium">
              Drop images to upload
            </p>
            <p className="text-blue-400/60 text-xs">
              jpg, png, gif, webp · max 1 MB
            </p>
          </div>
        )}

        {attachedFiles.length > 0 && !isDragging && (
          <div className="flex gap-3 p-3 pb-0 flex-wrap">
            {attachedFiles.map((attached, i) => (
              <FilePreview
                key={i}
                attached={attached}
                onRemove={() => removeFile(i)}
              />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-3 py-2.5">
          <button
            name="upload image"
            title="upload image"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-gray-200 transition-colors shrink-0 mb-0.5 cursor-pointer"
          >
            <Plus size={20} />
          </button>
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onInput={handleInput}
            maxLength={500}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachedFiles.length > 0
                ? "Add a comment (optional)"
                : `Message #${channelName}`
            }
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-400 resize-none outline-none max-h-50 leading-5"
          />
          <div className="flex items-center gap-2 shrink-0 mb-0.5">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Gift size={20} />
            </button>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Sticker size={20} />
            </button>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Smile size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
