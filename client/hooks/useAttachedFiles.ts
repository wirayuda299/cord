import { useState, useEffect, useCallback, useRef } from "react";
import { validateFiles, MAX_FILES } from "@/lib/shared/file-validation";

type AttachedFile = {
  file: File;
  preview: string;
};

export function useAttachedFiles() {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const attachedFilesRef = useRef(attachedFiles);
  attachedFilesRef.current = attachedFiles;

  useEffect(() => {
    return () => {
      attachedFilesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const { valid, errors: validationErrors } = validateFiles(
      files,
      attachedFilesRef.current.length
    );

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setTimeout(() => setErrors([]), 4000);
    }

    if (valid.length === 0) return;

    const newFiles = valid.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setAttachedFiles((prev) => [...prev, ...newFiles].slice(0, MAX_FILES));
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setAttachedFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, [addFiles]);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter(Boolean) as File[];
    if (files.length > 0) addFiles(files);
  }, [addFiles]);

  return {
    attachedFiles,
    errors,
    isDragging,
    addFiles,
    removeFile,
    clearFiles,
    clearErrors,
    onDragOver,
    onDragLeave,
    onDrop,
    onPaste,
  };
}
