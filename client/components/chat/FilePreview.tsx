import { X } from "lucide-react";
import Image from "next/image";

type AttachedFile = {
  file: File;
  preview: string;
};

type FilePreviewProps = {
  attached: AttachedFile;
  onRemove: () => void;
};

export function FilePreview({ attached, onRemove }: FilePreviewProps) {
  return (
    <div className="relative group shrink-0">
      <div className="relative w-48 h-36 bg-surface-raised border border-white/10 rounded-xl overflow-hidden">
        <Image
          src={attached.preview}
          alt={attached.file.name || "Attached file"}
          fill
          className="object-cover"
          loading="lazy"
          unoptimized={attached.preview.startsWith("blob:")}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
          <p className="text-white text-xs truncate">{attached.file.name}</p>
          <p className="text-white/50 text-xs">
            {(attached.file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
      <button
        onClick={onRemove}
        type="button"
        aria-label="Remove file"
        className="absolute -top-2 -right-2 size-5 bg-destructive hover:bg-destructive-hover rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={12} className="text-white" />
      </button>
    </div>
  );
}
