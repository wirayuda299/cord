import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  danger: {
    iconBox: "bg-red-500/15",
    iconColor: "text-red-400",
    confirmButton: "bg-red-600 hover:bg-red-500",
  },
  success: {
    iconBox: "bg-green-500/15",
    iconColor: "text-green-400",
    confirmButton: "bg-green-600 hover:bg-green-500",
  },
} as const;

type ConfirmDialogProps = {
  icon: ReactNode;
  tone?: keyof typeof TONES;
  title: string;
  subtitle?: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
  className?: string;
};

export function ConfirmDialog({
  icon,
  tone = "danger",
  title,
  subtitle,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  children,
  className,
}: ConfirmDialogProps) {
  const t = TONES[tone];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          "bg-sidebar-primary border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4 shadow-2xl text-white",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center size-10 rounded-xl shrink-0",
              t.iconBox,
            )}
          >
            <span className={t.iconColor}>{icon}</span>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{title}</p>
            {subtitle && (
              <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <p className="text-sm text-white/60 leading-relaxed">{description}</p>

        {children}

        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer",
              t.confirmButton,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
