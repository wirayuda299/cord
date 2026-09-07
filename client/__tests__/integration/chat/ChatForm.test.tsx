// components/chat/ChatForm.tsx
//
// Why: file upload lifecycle (stale-upload cleanup, cached-promise reuse on
// submit), drag/drop, banned-state disabling, membership-check redirect,
// emoji insertion at cursor position.

import { describe, it } from "vitest";

describe("ChatForm", () => {
   it.todo(
      "attaching a file starts uploadImage, and attaching a second file before the first resolves deletes the now-stale upload's asset via deleteImage (the currentUpload.id !== uploadId branch)",
   );
   it.todo(
      "removing the only attached file (no upload result yet) triggers cleanup via deleteImage on upload.result",
   );
   it.todo(
      "handleSubmit no-ops when isSubmitting, isBanned, !isConnected, or both message and attachments are empty",
   );
   it.todo(
      "submit with serverID !== \"dm\" and isMemberJoined returning false redirects to /direct-messages instead of sending",
   );
   it.todo(
      "submit reuses uploadResultRef/uploadPromiseRef (cached upload) instead of re-uploading the same file",
   );
   it.todo("Enter (no shift) submits; Shift+Enter does not (onKeyDown)");
   it.todo(
      "clicking an emoji in the picker inserts it at the textarea's cursor position via insertEmoji, not just appended",
   );
   it.todo(
      "isBanned disables the textarea/upload/emoji buttons and swaps the placeholder text",
   );
});
