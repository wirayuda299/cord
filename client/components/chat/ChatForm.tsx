"use client";

import { Plus, Smile, Gift, Sticker, X, ImageIcon } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebsocket";
import type { Message, ResponseMessage } from "@/lib/types/chat";
import { deleteImage, uploadImage } from "@/lib/server/actions/images";
import { getPublicApiUrl } from "@/lib/env";
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/shared/file-validation";
import { useAttachedFiles } from "@/hooks/useAttachedFiles";
import { useAppStore } from "@/stores/store";
import { FilePreview } from "./FilePreview";

type UploadResult = { url: string; public_id: string };
type UploadState = "idle" | "active" | "consumed";

type ChatFormProps = {
  channelName: string;
  serverId: string;
  channelId: string;
  handleMessages: (msg: ResponseMessage) => void;
  handleDelete?: (id: string) => void;
  onOptimistic?: (msg: Message) => void;
  onUploadComplete?: (tempId: string) => void;
  onUploadFailed?: (tempId: string) => void;
  userId?: string;
};

export default function ChatForm({
  channelName,
  serverId,
  channelId,
  handleMessages,
  handleDelete,
  onOptimistic,
  onUploadComplete,
  onUploadFailed,
  userId = "usr_001",
}: ChatFormProps) {
  const selectedMsg = useAppStore((s) => s.selectedMsg);
  const setSelectedMsg = useAppStore((s) => s.setSelectedMsg);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPromiseRef = useRef<Promise<UploadResult> | null>(null);
  const uploadResultRef = useRef<UploadResult | null>(null);
  const uploadStateRef = useRef<UploadState>("idle");

  const { sendMessage } = useWebSocket(serverId, channelId, {
    onMessage: handleMessages,
    onDelete: handleDelete,
    onClose: () => console.log("disconnected"),
    onError: (e) => console.error("ws error", e),
  });

  const {
    attachedFiles,
    errors: fileErrors,
    isDragging,
    addFiles,
    removeFile,
    clearFiles,
    clearErrors,
    onDragOver,
    onDragLeave,
    onDrop,
    onPaste,
  } = useAttachedFiles();

  // Start uploading as soon as a file is attached; delete orphaned asset if file is removed
  useEffect(() => {
    if (attachedFiles.length === 0) {
      // File removed: if upload completed and was never consumed, delete the asset
      if (uploadResultRef.current && uploadStateRef.current !== "consumed") {
        deleteImage(uploadResultRef.current.public_id).catch(() => {});
      }
      uploadPromiseRef.current = null;
      uploadResultRef.current = null;
      uploadStateRef.current = "idle";
      return;
    }
    if (uploadPromiseRef.current !== null) return;

    uploadStateRef.current = "active";
    const promise = uploadImage(attachedFiles[0].file);
    uploadPromiseRef.current = promise;
    promise
      .then((r) => {
        uploadResultRef.current = r;
        // If file was removed while upload was in-flight (state reset to "idle"), delete now
        if (uploadStateRef.current === "idle") {
          deleteImage(r.public_id).catch(() => {});
          uploadResultRef.current = null;
        }
      })
      .catch(() => { uploadPromiseRef.current = null; });
  }, [attachedFiles]);

  // Delete orphaned asset if page is closed/reloaded before send
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (uploadResultRef.current && uploadStateRef.current !== "consumed") {
        fetch(`${getPublicApiUrl()}/image/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploadResultRef.current.public_id),
          keepalive: true,
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (attachedFiles.length <= 0 && !message.trim()) return;

    const blobPreview = attachedFiles[0]?.preview ?? "";
    const fileToUpload = attachedFiles[0]?.file;
    const trimmed = message.trim();

    // Capture upload refs before clearFiles() nulls them via useEffect
    const cachedResult = uploadResultRef.current;
    const cachedPromise = uploadPromiseRef.current;

    const tempId = `temp_${Date.now()}`;

    // Optimistic update: show message immediately with uploading status
    if (onOptimistic) {
      onOptimistic({
        id: tempId,
        content: trimmed,
        user_id: userId,
        username: "You",
        avatar: "",
        image_url: blobPreview,
        image_asset_id: "",
        channel_id: channelId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parent_msg_id: selectedMsg?.id ?? null,
        parent_content: selectedMsg?.content ?? null,
        parent_username: selectedMsg?.username ?? null,
        _status: blobPreview ? "uploading" : undefined,
      });
    }

    setMessage("");
    uploadStateRef.current = "consumed"; // prevent cleanup from deleting the asset we're about to use
    clearFiles();
    clearErrors();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (selectedMsg) setSelectedMsg(null);

    try {
      setIsSubmitting(true);

      let attachmentUrl = "";
      let attachmentId = "";

      if (blobPreview && fileToUpload) {
        // Use cached result/promise (started on file attach) — avoids double upload
        const result = cachedResult ?? await (cachedPromise ?? uploadImage(fileToUpload));
        attachmentUrl = result.url;
        attachmentId = result.public_id;
      }

      sendMessage({
        channel_id: channelId,
        message: trimmed,
        user_id: userId,
        attachment_url: attachmentUrl,
        attachment_id: attachmentId,
        ...(selectedMsg && { parent_message_id: selectedMsg.id }),
      });
      // Upload done + WS send queued — clear spinner immediately
      if (blobPreview) onUploadComplete?.(tempId);
    } catch {
      onUploadFailed?.(tempId);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    attachedFiles,
    message,
    sendMessage,
    userId,
    selectedMsg,
    setSelectedMsg,
    clearFiles,
    clearErrors,
    channelId,
    onOptimistic,
    onUploadComplete,
    onUploadFailed,
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

  return (
    <div
      className="px-4 pb-6 pt-2 shrink-0"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
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
        className={`flex flex-col bg-surface-chat rounded-xl transition-colors ${
          isDragging ? "ring-2 ring-discord-brand bg-discord-brand/10" : ""
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
            onPaste={onPaste}
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
