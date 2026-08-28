import "client-only";

type CopyTextOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export async function copyText(
  text: string,
  options?: CopyTextOptions
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    options?.onError?.(new Error("Clipboard API not available"));
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    options?.onSuccess?.();
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Failed to copy");
    options?.onError?.(err);
    return false;
  }
}
