import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Loader2 } from "lucide-react"

export default function SaveBar({
  isDirty,
  isSubmitting,
  status,
  onReset,
  pendingHint = "Careful! You have unsaved changes.",
}: {
  isDirty: boolean
  isSubmitting: boolean
  status: { type: "success" | "error"; message: string } | null
  onReset: () => void
  /** Shown when there are unsaved changes (not during success/error). */
  pendingHint?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md gap-5 fixed transition-all ease duration-300 p-3 bg-sidebar-secondary z-10",
        "left-1/2 -translate-x-1/2 w-max min-w-96",
        isDirty || status ? "bottom-4 opacity-100" : "-bottom-full opacity-0"
      )}
    >
      {status?.type === "error" ? (
        <>
          <p className="text-red-400 text-sm">{status.message}</p>
          <div className="flex gap-3 items-center">
            <Button type="button" variant="ghost" size="sm" onClick={onReset} className="text-gray-400 hover:text-white">
              Reset
            </Button>
            <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              Retry
            </Button>
          </div>
        </>
      ) : status?.type === "success" ? (
        <p className="text-green-400 text-sm flex items-center gap-2">
          <Check size={14} /> {status.message || "Changes saved!"}
        </p>
      ) : (
        <>
          <p className="text-sm text-white/70">{pendingHint}</p>
          <div className="flex gap-3 items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={onReset}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              Reset
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={12} className="animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
