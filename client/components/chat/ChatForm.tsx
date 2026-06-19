"use client";

import { Plus, Smile, Gift, Sticker, X, ImageIcon } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import type { ConnectionStatus } from "@/hooks/useWebsocket";
import { deleteImage, uploadImage } from "@/lib/server/actions/images";
import { getPublicApiUrl } from "@/lib/env";
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/shared/file-validation";
import { useAttachedFiles } from "@/hooks/useAttachedFiles";
import { useAppStore } from "@/stores/store";
import { emojiList } from "@/constants/emoji";
import { FilePreview } from "./FilePreview";
import { isMemberJoined, isMemberBanned } from "@/lib/server/actions/members";
import { useRouter } from "next/navigation";

type UploadResult = { url: string; public_id: string };
type UploadState = "idle" | "active" | "consumed";

type ChatFormProps = {
   channelName: string;
   channelId: string;
   userId?: string;
   placeholder?: string;
   sendMessage: (msg: object) => boolean;
   status: ConnectionStatus;
   thread_id: string | null;
   serverID: string;
   isBanned?: boolean;
};

export default function ChatForm({
   channelName,
   channelId,
   userId,
   placeholder,
   sendMessage,
   status,
   thread_id,
   serverID,
   isBanned = false,
}: ChatFormProps) {
   const selectedMsg = useAppStore((s) => s.selectedMsg);
   const setSelectedMsg = useAppStore((s) => s.setSelectedMsg);
   const [message, setMessage] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showEmojiPicker, setShowEmojiPicker] = useState(false);

   const textareaRef = useRef<HTMLTextAreaElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const uploadPromiseRef = useRef<Promise<UploadResult> | null>(null);
   const uploadResultRef = useRef<UploadResult | null>(null);
   const uploadStateRef = useRef<UploadState>("idle");
   const router = useRouter();
   const isConnected = status === "connected";

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
         .catch(() => {
            uploadPromiseRef.current = null;
         });
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
      return () =>
         window.removeEventListener("beforeunload", handleBeforeUnload);
   }, []);

   const handleInput = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
   }, []);

   const handleSubmit = useCallback(async () => {
      if (isSubmitting || isBanned) return;
      if (!isConnected) return;
      if (attachedFiles.length <= 0 && !message.trim()) return;

      const blobPreview = attachedFiles[0]?.preview ?? "";
      const fileToUpload = attachedFiles[0]?.file;
      const trimmed = message.trim();

      // Capture upload refs before clearFiles() nulls them via useEffect
      const cachedResult = uploadResultRef.current;
      const cachedPromise = uploadPromiseRef.current;

      setMessage("");
      uploadStateRef.current = "consumed"; // prevent cleanup from deleting the asset we're about to use
      clearFiles();
      clearErrors();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      if (selectedMsg) setSelectedMsg(null);

      try {
         setIsSubmitting(true);

         if (serverID !== "dm") {
            const isJoin = await isMemberJoined(serverID);
            if (!isJoin) {
               router.push("/direct-messages");
               return;
            }
         }

         let attachmentUrl = "";
         let attachmentId = "";

         if (blobPreview && fileToUpload) {
            // Use cached result/promise (started on file attach) — avoids double upload
            const result =
               cachedResult ??
               (await (cachedPromise ?? uploadImage(fileToUpload)));
            attachmentUrl = result.url;
            attachmentId = result.public_id;
         }

         const payload = {
            message: trimmed,
            user_id: userId,
            attachment_url: attachmentUrl,
            attachment_id: attachmentId,
            parent_message_id: selectedMsg?.id ?? null,
            channel_id: thread_id ? null : channelId,
            thread_id: thread_id ?? null,
         };

         const sent = sendMessage(payload);
         if (!sent) throw new Error("websocket is not connected");
      } catch {
         // message send failed — could show toast here
      } finally {
         setIsSubmitting(false);
      }
   }, [
      attachedFiles,
      isConnected,
      isSubmitting,
      isBanned,
      message,
      sendMessage,
      userId,
      selectedMsg,
      setSelectedMsg,
      clearFiles,
      clearErrors,
      channelId,
      serverID,
      router,
      thread_id,
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

   const insertEmoji = useCallback(
      (emoji: string) => {
         const el = textareaRef.current;
         if (!el) return;
         const start = el.selectionStart ?? message.length;
         const end = el.selectionEnd ?? message.length;
         const before = message.slice(0, start);
         const after = message.slice(end);
         const next = before + emoji + after;
         setMessage(next);
         requestAnimationFrame(() => {
            el.focus();
            const pos = start + emoji.length;
            el.setSelectionRange(pos, pos);
         });
      },
      [message],
   );

   const emojiPickerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (!showEmojiPicker) return;
      function handleClick(e: MouseEvent) {
         if (
            emojiPickerRef.current &&
            !emojiPickerRef.current.contains(e.target as Node)
         ) {
            setShowEmojiPicker(false);
         }
      }
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
   }, [showEmojiPicker]);

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
                  disabled={isSubmitting || isBanned}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-gray-200 transition-colors shrink-0 mb-0.5 cursor-pointer disabled:opacity-40"
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
                  disabled={isSubmitting || isBanned}
                  onKeyDown={handleKeyDown}
                  onPaste={onPaste}
                  placeholder={
                     isBanned
                        ? "You are banned from sending messages in this server"
                        : attachedFiles.length > 0
                          ? "Add a comment (optional)"
                          : !isConnected
                            ? "Connecting..."
                            : (placeholder ?? `Message #${channelName}`)
                  }
                  className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-400 resize-none outline-none max-h-50 leading-5 disabled:cursor-not-allowed"
               />
               <div className="flex items-center gap-2 shrink-0 mb-0.5">
                  <button
                     type="button"
                     disabled={isBanned}
                     className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                     <Gift size={20} />
                  </button>
                  <button
                     type="button"
                     disabled={isBanned}
                     className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                     <Sticker size={20} />
                  </button>
                  <div className="relative flex items-center">
                     <button
                        type="button"
                        disabled={isBanned}
                        onClick={() => setShowEmojiPicker((s) => !s)}
                        className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                     >
                        <Smile size={20} />
                     </button>
                     {showEmojiPicker && (
                        <div
                           ref={emojiPickerRef}
                           className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 bg-surface-raised border border-white/10 rounded-md shadow-xl shadow-black/40 p-2"
                        >
                           <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
                              {emojiList.map((e) => (
                                 <button
                                    key={e.code}
                                    type="button"
                                    onClick={() => {
                                       insertEmoji(e.emoji);
                                       setShowEmojiPicker(false);
                                    }}
                                    className="flex items-center justify-center p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer text-lg"
                                    title={e.code}
                                 >
                                    {e.emoji}
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
