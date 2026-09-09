import ChatForm from "@/components/chat/ChatForm";
import { deleteImage, uploadImage } from "@/lib/actions/images";
import { isMemberJoined } from "@/lib/actions/members";
import { emojiList } from "@/constants/emoji";
import { useRouter } from "next/navigation";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/images", () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

vi.mock("@/lib/actions/members", () => ({
  isMemberJoined: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

type UploadResponse = {
  success: boolean;
  data?: { url: string; public_id: string };
  message: string;
};

type Props = ComponentProps<typeof ChatForm>;

function makeProps(overrides: Partial<Props> = {}): Props {
  return {
    channelName: "general",
    channelId: "chan_1",
    userId: "user_1",
    sendMessage: vi.fn(() => true),
    status: "connected",
    thread_id: null,
    serverID: "srv_1",
    isBanned: false,
    ...overrides,
  };
}

function makeImage(name: string) {
  return new File(["content"], name, { type: "image/png" });
}

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

beforeEach(() => {
  // jsdom doesn't implement these — patched onto the real URL constructor
  // (not replaced via vi.stubGlobal) so next/image's own `new URL(...)`
  // calls inside FilePreview still work when a file is attached.
  URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
  URL.revokeObjectURL = vi.fn();
  let counter = 0;
  vi.stubGlobal("crypto", { randomUUID: vi.fn(() => `uuid-${++counter}`) });

  vi.mocked(deleteImage).mockResolvedValue({
    success: true,
    message: "image deleted",
  });
  vi.mocked(isMemberJoined).mockResolvedValue(true);
  vi.mocked(useRouter).mockReturnValue({
    push: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("ChatForm", () => {
  it("attaching a second file before the first upload resolves deletes the stale upload via deleteImage", async () => {
    let resolveA!: (v: UploadResponse) => void;
    const uploadAPromise = new Promise<UploadResponse>((res) => {
      resolveA = res;
    });

    vi.mocked(uploadImage)
      .mockReturnValueOnce(uploadAPromise)
      .mockResolvedValueOnce({
        success: true,
        data: { url: "url-b", public_id: "id-b" },
        message: "ok",
      });

    const { container } = render(<ChatForm {...makeProps()} />);
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [makeImage("a.png")] } });
    expect(uploadImage).toHaveBeenCalledTimes(1);

    // A's upload hasn't resolved yet (no result) — removing it shouldn't
    // trigger a cleanup delete.
    fireEvent.click(screen.getByLabelText("Remove file"));
    expect(deleteImage).not.toHaveBeenCalled();

    // Attach B while A's upload is still in flight — B becomes the current upload.
    fireEvent.change(fileInput, { target: { files: [makeImage("b.png")] } });
    expect(uploadImage).toHaveBeenCalledTimes(2);

    // A resolves late — it's stale now, so its asset gets cleaned up.
    await act(async () => {
      resolveA({
        success: true,
        data: { url: "url-a", public_id: "id-a" },
        message: "ok",
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(deleteImage).toHaveBeenCalledWith("id-a");
  });

  it("removing the only attached file after its upload has completed deletes the now-orphaned asset via deleteImage", async () => {
    let resolveUpload!: (v: UploadResponse) => void;
    const uploadPromise = new Promise<UploadResponse>((res) => {
      resolveUpload = res;
    });
    vi.mocked(uploadImage).mockReturnValueOnce(uploadPromise);

    const { container } = render(<ChatForm {...makeProps()} />);
    fireEvent.change(getFileInput(container), {
      target: { files: [makeImage("a.png")] },
    });
    expect(uploadImage).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpload({
        success: true,
        data: { url: "url-a", public_id: "id-a" },
        message: "ok",
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.click(screen.getByLabelText("Remove file"));

    expect(deleteImage).toHaveBeenCalledWith("id-a");
  });

  it("handleSubmit no-ops while isBanned", () => {
    const props = makeProps({ isBanned: true });
    render(<ChatForm {...props} />);
    const textarea = screen.getByTitle("chatinput");

    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(props.sendMessage).not.toHaveBeenCalled();
  });

  it("handleSubmit no-ops while not connected", () => {
    const props = makeProps({ status: "connecting" });
    render(<ChatForm {...props} />);
    const textarea = screen.getByTitle("chatinput");

    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(props.sendMessage).not.toHaveBeenCalled();
  });

  it("handleSubmit no-ops when message is empty and no files are attached", () => {
    const props = makeProps();
    render(<ChatForm {...props} />);
    const textarea = screen.getByTitle("chatinput");

    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(props.sendMessage).not.toHaveBeenCalled();
  });

  it("handleSubmit no-ops on a second Enter while the first submission is still in flight", async () => {
    let resolveJoin!: (v: boolean) => void;
    const joinPromise = new Promise<boolean>((res) => {
      resolveJoin = res;
    });
    vi.mocked(isMemberJoined).mockReturnValueOnce(joinPromise);

    const props = makeProps({ serverID: "srv_1" }); // not "dm" -> goes through isMemberJoined
    render(<ChatForm {...props} />);
    const textarea = screen.getByTitle("chatinput");

    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter" }); // first submit starts, awaiting isMemberJoined

    expect(isMemberJoined).toHaveBeenCalledTimes(1);

    // Type new content and press Enter again while still submitting. If the
    // isSubmitting guard weren't there, this non-empty message would sail
    // through to a second isMemberJoined call.
    fireEvent.change(textarea, { target: { value: "second message" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(isMemberJoined).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveJoin(true);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(props.sendMessage).toHaveBeenCalledTimes(1);
    expect(props.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: "hello" }),
    );
  });

  it('submit with serverID !== "dm" and isMemberJoined returning false redirects to /direct-messages instead of sending', async () => {
    vi.mocked(isMemberJoined).mockResolvedValue(false);
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push,
    } as unknown as ReturnType<typeof useRouter>);

    const props = makeProps({ serverID: "srv_1" });
    render(<ChatForm {...props} />);
    const textarea = screen.getByTitle("chatinput");

    fireEvent.change(textarea, { target: { value: "hi" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    await waitFor(() => expect(push).toHaveBeenCalledWith("/direct-messages"));
    expect(props.sendMessage).not.toHaveBeenCalled();
  });

  it("submit reuses a completed attach-time upload instead of re-uploading, and cleanup doesn't delete it", async () => {
    let resolveUpload!: (v: UploadResponse) => void;
    const uploadPromise = new Promise<UploadResponse>((res) => {
      resolveUpload = res;
    });
    vi.mocked(uploadImage).mockReturnValueOnce(uploadPromise);

    const props = makeProps({ serverID: "dm" }); // skip isMemberJoined path
    const { container } = render(<ChatForm {...props} />);

    fireEvent.change(getFileInput(container), {
      target: { files: [makeImage("a.png")] },
    });
    expect(uploadImage).toHaveBeenCalledTimes(1); // attach-time upload

    // let the attach-time upload finish before submitting
    await act(async () => {
      resolveUpload({
        success: true,
        data: { url: "url-a", public_id: "id-a" },
        message: "ok",
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    const textarea = screen.getByTitle("chatinput");
    fireEvent.keyDown(textarea, { key: "Enter" }); // submit with the same attached file

    await waitFor(() =>
      expect(props.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          attachment_url: "url-a",
          attachment_id: "id-a",
        }),
      ),
    );

    expect(uploadImage).toHaveBeenCalledTimes(1); // not re-uploaded
    expect(deleteImage).not.toHaveBeenCalled(); // clearFiles()'s cleanup didn't delete it
  });

  it("submit awaits an in-flight attach-time upload instead of starting a duplicate one", async () => {
    let resolveUpload!: (v: UploadResponse) => void;
    const uploadPromise = new Promise<UploadResponse>((res) => {
      resolveUpload = res;
    });
    vi.mocked(uploadImage).mockReturnValueOnce(uploadPromise);

    const props = makeProps({ serverID: "dm" });
    const { container } = render(<ChatForm {...props} />);

    fireEvent.change(getFileInput(container), {
      target: { files: [makeImage("a.png")] },
    });
    expect(uploadImage).toHaveBeenCalledTimes(1);

    // submit immediately — the attach-time upload hasn't resolved yet
    const textarea = screen.getByTitle("chatinput");
    fireEvent.keyDown(textarea, { key: "Enter" });

    await act(async () => {
      resolveUpload({
        success: true,
        data: { url: "url-a", public_id: "id-a" },
        message: "ok",
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(props.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          attachment_url: "url-a",
          attachment_id: "id-a",
        }),
      ),
    );

    expect(uploadImage).toHaveBeenCalledTimes(1); // never re-uploaded
    expect(deleteImage).not.toHaveBeenCalled(); // not treated as stale/abandoned
  });

  it("Enter without Shift submits; Shift+Enter does not", async () => {
    const props = makeProps({ serverID: "dm" });
    render(<ChatForm {...props} />);
    const textarea = screen.getByTitle("chatinput") as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(props.sendMessage).not.toHaveBeenCalled();
    expect(textarea.value).toBe("hello");

    fireEvent.keyDown(textarea, { key: "Enter" });

    await waitFor(() => expect(props.sendMessage).toHaveBeenCalledTimes(1));
  });

  it("clicking an emoji inserts it at the textarea's cursor position, not just appended", () => {
    const props = makeProps();
    const { container } = render(<ChatForm {...props} />);
    const textarea = screen.getByTitle("chatinput") as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: "Hello world" } });
    textarea.setSelectionRange(5, 5); // cursor right after "Hello"

    const smileButton = container
      .querySelector("svg.lucide-smile")!
      .closest("button")!;
    fireEvent.click(smileButton);

    const emojiButton = screen.getByTitle(emojiList[0].code);
    fireEvent.click(emojiButton);

    expect(textarea.value).toBe(`Hello${emojiList[0].emoji} world`);
  });

  it("isBanned disables all interactive controls and swaps the placeholder text", () => {
    render(<ChatForm {...makeProps({ isBanned: true })} />);

    const textarea = screen.getByTitle("chatinput") as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
    expect(textarea.placeholder).toBe(
      "You are banned from sending messages in this server",
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
