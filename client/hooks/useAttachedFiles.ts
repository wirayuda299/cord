import { useState, useEffect, useCallback } from "react";
import { validateFiles, MAX_FILES } from "@/lib/shared/file-validation";

type AttachedFile = {
  file: File;
  preview: string;
};

interface UseAttachedFilesReturn {
  attachedFiles: AttachedFile[];
  errors: string[];
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  clearErrors: () => void;
}

export function useAttachedFiles(): UseAttachedFilesReturn {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Cleanup object URLs on unmount or file removal
  useEffect(() => {
    return () => {
      attachedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [attachedFiles]);

  const addFiles = useCallback((files: File[]) => {
    const { valid, errors: validationErrors } = validateFiles(
      files,
      attachedFiles.length
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
  }, [attachedFiles.length]);

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

  return { attachedFiles, errors, addFiles, removeFile, clearFiles, clearErrors };
}
