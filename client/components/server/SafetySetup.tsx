"use client";

import { useState, useEffect } from "react";
import { updateSafetySetup } from "@/lib/server/actions/servers";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  Loader2,
  LockKeyhole,
  MessageSquareOff,
  Shield,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  CONTENT_FILTERS,
  NOTIFICATION_OPTIONS,
  VERIFICATION_LEVELS,
} from "@/constants/safety";
import { getSafetySetup } from "@/lib/client/api/safety_rules";

// ─── schema ───────────────────────────────────────────────────────────────────

const safetySchema = z.object({
  verificationLevel: z.enum(["none", "low", "medium", "high", "highest"]),
  contentFilter: z.enum(["disabled", "no_role", "everyone"]),
  require2FA: z.boolean(),
  dmSpamFilter: z.boolean(),
  defaultNotifications: z.enum(["all_messages", "only_mentions"]),
});

type SafetyFormValues = z.infer<typeof safetySchema>;

const DEFAULT_VALUES: SafetyFormValues = {
  verificationLevel: "low",
  contentFilter: "no_role",
  require2FA: false,
  dmSpamFilter: true,
  defaultNotifications: "only_mentions",
};

// ─── data ─────────────────────────────────────────────────────────────────────

// ─── shared option card ───────────────────────────────────────────────────────

function OptionCard<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: {
    value: T;
    label: string;
    description: string;
    icon?: React.ElementType;
    color?: string;
    bg?: string;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
        selected
          ? "border-discord-blue/60 bg-discord-blue/8"
          : "border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10",
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center size-9 rounded-lg shrink-0 mt-0.5",
            option.bg ?? "bg-white/5",
          )}
        >
          <Icon size={17} className={option.color ?? "text-white/40"} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-tight",
            selected ? "text-white" : "text-white/70",
          )}
        >
          {option.label}
        </p>
        <p className="text-xs text-white/30 mt-1 leading-relaxed">
          {option.description}
        </p>
      </div>

      <div
        className={cn(
          "flex items-center justify-center size-5 rounded-full border-2 shrink-0 mt-0.5 transition-all",
          selected
            ? "border-discord-blue bg-discord-blue"
            : "border-white/20 bg-transparent",
        )}
      >
        {selected && (
          <Check size={10} strokeWidth={3} className="text-white" />
        )}
      </div>
    </button>
  );
}

// ─── section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

// ─── toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-2 md:p-4 rounded-xl bg-white/2 border border-white/5">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center size-9 rounded-lg bg-white/5 shrink-0 mt-0.5">
          <Icon size={16} className="text-white/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-white/30 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <Switch
        className="data-unchecked:bg-sidebar-primary data-checked:bg-discord-blue shadow shrink-0 mt-1"
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}

// ─── save bar ─────────────────────────────────────────────────────────────────

function SaveBar({
  isDirty,
  isSubmitting,
  status,
  onReset,
}: {
  isDirty: boolean;
  isSubmitting: boolean;
  status: { type: "success" | "error"; message: string } | null;
  onReset: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md gap-5 fixed transition-all ease duration-300 p-3 bg-sidebar-secondary z-10",
        "left-1/2 -translate-x-1/2 w-max min-w-96",
        isDirty || status
          ? "bottom-4 opacity-100"
          : "-bottom-full opacity-0",
      )}
    >
      {status?.type === "error" ? (
        <>
          <p className="text-red-400 text-sm">{status.message}</p>
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={onReset}
              className="text-sm text-gray-400"
            >
              Reset
            </button>
            <button
              type="submit"
              className="bg-green-600 px-3 rounded py-1 text-sm"
            >
              Retry
            </button>
          </div>
        </>
      ) : status?.type === "success" ? (
        <p className="text-green-400 text-sm flex items-center gap-2">
          <Check size={14} /> Changes saved!
        </p>
      ) : (
        <>
          <p className="text-sm text-white/70">
            Careful! You have unsaved changes.
          </p>
          <div className="flex gap-3 items-center">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onReset}
              className="text-sm text-gray-400 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 px-3 rounded py-1 text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <Loader2 size={12} className="animate-spin" />
              )}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SafetySetup({ serverId }: { serverId: string }) {
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const form = useForm<SafetyFormValues>({
    resolver: zodResolver(safetySchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty, isSubmitting },
  } = form;

  useEffect(() => {
    async function loadSafety() {
      const { error, data } = await getSafetySetup(serverId);
      if (!error && data) {
        reset({
          verificationLevel: data.level || "low",
          contentFilter: data.content_filter || "no_role",
          require2FA: data.require_2_fa || false,
          dmSpamFilter: data.dm_spam_filter || false,
          defaultNotifications: data.default_notification || "only_mentions",
        });
      }
    }
    loadSafety();
  }, [serverId, reset]);

  const onSubmit = async (values: SafetyFormValues) => {
    setSubmitStatus(null);

    const res = await updateSafetySetup(serverId, values);
    if (res && !res.success) {
      setSubmitStatus({
        type: "error",
        message: res.message,
      });
      return;
    }


    reset(values);
    setSubmitStatus({
      type: "success",
      message: "Safety settings saved!",
    });
    setTimeout(() => setSubmitStatus(null), 3000);
  };

  const verificationLevel = watch("verificationLevel");
  const contentFilter = watch("contentFilter");
  const defaultNotifications = watch("defaultNotifications");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="overflow-y-auto max-h-screen w-full text-white"
    >
      <div className="px-3 md:px-8 pt-8 pb-24 flex flex-col gap-10 max-w-2xl">
        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
          <div className="flex items-center justify-center size-10 rounded-xl bg-green-500/15">
            <Shield size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold text-xl">Safety Setup</h2>
            <p className="text-xs md:text-sm text-white/40 mt-0.5">
              Control who can join and what gets filtered
            </p>
          </div>
        </div>

        <Section
          title="Verification Level"
          description="The minimum requirements a member must meet before they can send messages in this server."
        >
          <Controller
            control={control}
            name="verificationLevel"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                {VERIFICATION_LEVELS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    selected={field.value === opt.value}
                    onSelect={() => field.onChange(opt.value)}
                  />
                ))}
              </div>
            )}
          />
        </Section>

        <Section
          title="Explicit Content Filter"
          description="Automatically scan and delete messages containing explicit content."
        >
          <Controller
            control={control}
            name="contentFilter"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                {CONTENT_FILTERS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    selected={field.value === opt.value}
                    onSelect={() => field.onChange(opt.value)}
                  />
                ))}
              </div>
            )}
          />
        </Section>

        <Section
          title="Default Notification Settings"
          description="The default notification setting applied to new members when they join."
        >
          <Controller
            control={control}
            name="defaultNotifications"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                {NOTIFICATION_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    selected={field.value === opt.value}
                    onSelect={() => field.onChange(opt.value)}
                  />
                ))}
              </div>
            )}
          />
        </Section>

        <Section
          title="Moderation & Filtering"
          description="Additional safeguards to keep your community secure."
        >
          <div className="flex flex-col gap-2">
            <Controller
              control={control}
              name="require2FA"
              render={({ field }) => (
                <ToggleRow
                  icon={LockKeyhole}
                  label="Require 2FA for Moderation"
                  description="Moderators must have two-factor authentication enabled to use kick, ban, or timeout actions"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="dmSpamFilter"
              render={({ field }) => (
                <ToggleRow
                  icon={MessageSquareOff}
                  label="DM Spam Filter"
                  description="Automatically filter likely spam or scam DMs sent to server members from unknown users"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </Section>

        {/* Summary card */}
        <div className="rounded-xl border border-white/5 bg-white/2 p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
            Current Configuration
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
            {[
              {
                label: "Verification",
                value: VERIFICATION_LEVELS.find(
                  (l) => l.value === verificationLevel,
                )?.label,
              },
              {
                label: "Content Filter",
                value: CONTENT_FILTERS.find(
                  (f) => f.value === contentFilter,
                )?.label,
              },
              {
                label: "Notifications",
                value:
                  defaultNotifications === "all_messages"
                    ? "All messages"
                    : "Only @mentions",
              },
              {
                label: "2FA Required",
                value: watch("require2FA") ? "Yes" : "No",
              },
              {
                label: "DM Spam Filter",
                value: watch("dmSpamFilter") ? "Enabled" : "Disabled",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-white/30">{label}</span>
                <span className="text-white/70 font-medium truncate">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SaveBar
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        status={submitStatus}
        onReset={() => {
          form.reset(DEFAULT_VALUES);
          setSubmitStatus(null);
        }}
      />
    </form>
  );
}
