import { act, renderHook } from "@testing-library/react";
import { useAttachedFiles } from "@/hooks/useAttachedFiles";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// jsdom doesn't implement these — calling the real ones throws "not implemented".
// Stubbed so createObjectURL/revokeObjectURL calls are observable and deterministic.
beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn((file: File) => `blob:${file.name}`),
    revokeObjectURL: vi.fn(),
  });
  // deterministic ids instead of real random UUIDs, so assertions can match on them
  let counter = 0;
  vi.stubGlobal("crypto", { randomUUID: vi.fn(() => `uuid-${++counter}`) });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function makeImage(name: string) {
  return new File(["content"], name, { type: "image/png" });
}

describe("useAttachedFiles", () => {
  it("addFiles() attaches a valid image and assigns it a uuid id + blob preview url", () => {
    const { result } = renderHook(() => useAttachedFiles());

    act(() => {
      result.current.addFiles([makeImage("photo.png")]);
    });

    expect(result.current.attachedFiles).toEqual([
      { id: "uuid-1", file: expect.any(File), preview: "blob:photo.png" },
    ]);
    expect(result.current.errors).toEqual([]);
  });

  it("addFiles() rejects a non-image file with an error message, which auto-clears after 4s", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAttachedFiles());

    act(() => {
      result.current.addFiles([
        new File(["x"], "doc.pdf", { type: "application/pdf" }),
      ]);
    });

    expect(result.current.errors).toEqual([
      "doc.pdf: only jpg, png, gif, webp allowed",
    ]);
    expect(result.current.attachedFiles).toEqual([]);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.errors).toEqual([]);
  });

  it("addFiles() over MAX_FILES: BUG - creates a preview for every valid file, then drops the excess without revoking its url (leak)", () => {
    // MAX_FILES is 1. validateFiles only checks currentCount (0) before this call,
    // so both files pass validation; the hook creates a preview for each, THEN
    // slices the combined list down to MAX_FILES — meaning the dropped file's
    // object URL is created but never revoked. This test pins that leak.
    const { result } = renderHook(() => useAttachedFiles());

    act(() => {
      result.current.addFiles([makeImage("a.png"), makeImage("b.png")]);
    });

    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(result.current.attachedFiles).toHaveLength(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("removeFile(index) removes that file and revokes its preview url", () => {
    const { result } = renderHook(() => useAttachedFiles());

    act(() => {
      result.current.addFiles([makeImage("photo.png")]);
    });
    act(() => {
      result.current.removeFile(0);
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:photo.png");
    expect(result.current.attachedFiles).toEqual([]);
  });

  it("clearFiles() empties the list and revokes every attached preview url", () => {
    const { result } = renderHook(() => useAttachedFiles());

    act(() => {
      result.current.addFiles([makeImage("photo.png")]);
    });
    act(() => {
      result.current.clearFiles();
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:photo.png");
    expect(result.current.attachedFiles).toEqual([]);
  });

  it("unmounting the hook revokes any preview urls still attached (cleanup effect)", () => {
    const { result, unmount } = renderHook(() => useAttachedFiles());

    act(() => {
      result.current.addFiles([makeImage("photo.png")]);
    });

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:photo.png");
  });

  it("onDrop() attaches the dropped file and turns isDragging back off", () => {
    const { result } = renderHook(() => useAttachedFiles());

    act(() => {
      result.current.onDragOver({ preventDefault: vi.fn() } as never);
    });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.onDrop({
        preventDefault: vi.fn(),
        dataTransfer: { files: [makeImage("dropped.png")] },
      } as never);
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.attachedFiles).toHaveLength(1);
  });

  it("onPaste() attaches clipboard items of kind 'file' and skips 'string' items", () => {
    const { result } = renderHook(() => useAttachedFiles());
    const file = makeImage("pasted.png");

    act(() => {
      result.current.onPaste({
        clipboardData: {
          items: [
            { kind: "file", getAsFile: () => file },
            // getAsFile returns a real file here on purpose: if the kind
            // filter is ever removed, this item would leak through and
            // fail the assertion below instead of silently passing.
            { kind: "string", getAsFile: () => makeImage("should-be-skipped.png") },
          ],
        },
      } as never);
    });

    expect(result.current.attachedFiles).toHaveLength(1);
    expect(result.current.attachedFiles[0].file).toBe(file);
  });
});
