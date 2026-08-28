"use client";

import { Check, Loader2, X } from "lucide-react";

import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { useAttachedFiles } from "@/hooks/useAttachedFiles";
import { useEffect, useState } from "react";
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/file-validation";
import { cn } from "@/lib/utils";
import { Switch } from "../ui/switch";
import useSWR from "swr";
import getServerById from "@/lib/api/server";
import { useParams } from "next/navigation";
import { uploadImage } from "@/lib/actions/images";
import { updateServerSchema, UpdateServerType } from "@/lib/validations/server";
import { updateServer } from "@/lib/actions/servers";

const gradients: [string, string][] = [
  ["#1f1f1f", "#3a3a3a"], // dark gray
  ["#ff4d8d", "#ff9ecb"], // pink
  ["#ff3b3b", "#ff8a5c"], // red-orange
  ["#ff7a18", "#ffd166"], // orange-yellow
  ["#ffd43b", "#fff3a3"], // yellow
  ["#6a4c93", "#b497d6"], // purple
  ["#1e90ff", "#70d6ff"], // blue
  ["#2ec4b6", "#90f1ef"], // teal
  ["#3a5a00", "#a4c639"], // green
  ["#2b2b2b", "#6e6e6e"], // neutral gray
];

type PreviewProps = {
  selected: string[];
  server?: {
    name?: string;
    logo?: string;
  };
};

function ServerProfilePreview({ selected, server }: PreviewProps) {
  return (
    <div
      style={{
        background: `radial-gradient(circle at bottom,
                    ${selected[0]} 0%,
                    ${selected[0]}cc 30%,
                    ${selected[1]} 70%,
                    ${selected[1]} 100% )`,
      }}
      className="w-full md:max-w-64 sm:max-w-none sm:size-64 sm:min-w-64 aspect-square sm:aspect-auto rounded-lg mx-auto lg:mx-0"
    >
      <div className="absolute h-max w-full p-3 bottom-0 bg-(--discord-chat) rounded-b-lg">
        <div className="size-14 border border-sidebar-secondary rounded-md absolute bottom-20 left-7">
          {server?.logo ? (
            <Image
              src={server.logo}
              className="size-full object-cover rounded-md"
              width={56}
              height={56}
              alt="icon"
            />
          ) : (
            <div className="size-full rounded-md bg-gray-500" />
          )}
        </div>
        <div className="mt-10">
          <p className="truncate">{server?.name || "Untitled server"}</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="flex items-center text-xs gap-2">
              <span className="block size-2 rounded-full bg-green-500" />
              0 online
            </p>
            <p className="flex items-center text-xs gap-2">
              <span className="block size-2 rounded-full bg-gray-500" />1
              member
            </p>
          </div>
          <p className="text-xs pt-1">Since 19 Desember 2025</p>
        </div>
      </div>
    </div>
  );
}

function GradientSwatch({
  colors,
  selected,
  onSelect,
}: {
  colors: [string, string];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Banner gradient ${colors[0]} to ${colors[1]}`}
      className={cn(
        "size-24 sm:size-32 rounded-md cursor-pointer transition-shadow",
        selected &&
        "ring-2 ring-discord-blue ring-offset-2 ring-offset-surface-base",
      )}
      style={{
        background: `radial-gradient(circle at bottom,
          ${colors[0]} 0%,
          ${colors[0]}cc 30%,
          ${colors[1]} 70%,
          ${colors[1]} 100% )`,
      }}
    />
  );
}

function ProfileFormSkeleton() {
  return (
    <div
      className="mt-8 flex flex-col gap-6 animate-pulse"
      aria-hidden="true"
    >
      <div className="h-10 w-full max-w-md rounded bg-sidebar-secondary/60" />
      <div className="h-36 w-36 rounded-md bg-sidebar-secondary/60" />
      <div className="flex flex-wrap gap-3">
        {gradients.map((_, i) => (
          <div
            key={i}
            className="size-24 sm:size-32 rounded-md bg-sidebar-secondary/60"
          />
        ))}
      </div>
      <div className="h-24 w-full rounded-md bg-sidebar-secondary/60" />
      <div className="h-8 w-40 rounded bg-sidebar-secondary/60" />
    </div>
  );
}

export default function ServerProfile() {
  const params = useParams();
  const id = params.id as string;

  const { isLoading, data, error } = useSWR(
    () => (id ? "/api/server" : null),
    () => getServerById(id),
  );

  const form = useForm<UpdateServerType>({
    resolver: zodResolver(updateServerSchema),
    defaultValues: {
      name: "",
      icon: "",
      banner: [],
      description: "",
      private: false,
    },
    mode: "all",
  });
  const {
    addFiles,
    attachedFiles,
    removeFile,
    errors,
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
  } = useAttachedFiles();
  const watchedBanner = form.watch("banner");
  const selected =
    watchedBanner && watchedBanner.length >= 2 ? watchedBanner : gradients[0];
  const isChange = form.formState.isDirty;
  const isSubmitting = form.formState.isSubmitting;
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (data) {
      form.reset({
        name: data?.name ?? "",
        icon: data?.logo ?? "",
        banner: data?.banner_colors,
        private: data?.private ?? false,
        description: data?.description ?? "",
      });
    }
    // form.reset is stable across renders; only re-run when fetched data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const update = async (data: UpdateServerType) => {
    setSubmitStatus(null);
    let iconUrl = data.icon;
    let iconAssetId = "";

    if (attachedFiles.length > 0) {
      const uploaded = await uploadImage(attachedFiles[0].file);

      if (uploaded.success && uploaded.data) {
        iconUrl = uploaded.data.url;
        iconAssetId = uploaded.data.public_id;
      } else {
        alert(uploaded.message)
        return
      }
    }

    const result = await updateServer({
      serverId: id,
      fields: form.formState.dirtyFields as Partial<
        Record<keyof UpdateServerType, boolean>
      >,
      payload: {
        name: data.name,
        banner_colors: data.banner,
        description: data.description,
        private: data.private,
        icon: iconUrl,
        icon_asset_id: iconAssetId,
      },
    });

    if (!result.success) {
      setSubmitStatus({ type: "error", message: result.message });
      return;
    }

    form.reset({ ...data, icon: iconUrl });
    setSubmitStatus({ type: "success", message: "Changes saved!" });
    setTimeout(() => setSubmitStatus(null), 3000);
  }

  if (error)
    return (
      <p className="p-5 text-sm text-destructive">{JSON.stringify(error)}</p>
    );

  return (
    <div className="w-full h-full overflow-y-auto text-white px-4 sm:px-6 lg:px-8 pt-5 pb-28">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-start gap-8">
        <div className="w-full lg:flex-1 lg:min-w-0 order-2 lg:order-1">
          <header className="space-y-2">
            <h2 className="font-semibold text-xl">Server Profile</h2>
            <p className="text-sm text-text-muted max-w-2xl">
              Customize how your server appears in invite links and, if
              enabled, in Server Discovery and Announcement Channel
              messages
            </p>
          </header>

          <form onSubmit={form.handleSubmit(update)}>
            {isLoading ? (
              <ProfileFormSkeleton />
            ) : (
              <div className="mt-8 flex flex-col gap-6">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="server-name">
                        Server name
                      </FieldLabel>
                      <Input
                        id="server-name"
                        max={50}
                        maxLength={50}
                        required
                        autoComplete="off"
                        className="w-full max-w-md rounded border border-sidebar-primary/20 focus-visible:outline-none ring-0!"
                        {...field}
                        placeholder="server name..."
                      />
                    </Field>
                  )}
                />

                {attachedFiles.length > 0 && (
                  <div className="relative size-28 sm:size-36">
                    <Image
                      className="size-full object-cover rounded-md"
                      src={attachedFiles[0].preview}
                      width={100}
                      height={100}
                      alt="icon"
                    />
                    <button
                      type="button"
                      aria-label="Remove selected icon"
                      className="absolute cursor-pointer top-0 right-0 rounded-full bg-white"
                      onClick={() => {
                        removeFile(0);
                        form.resetField("icon");
                      }}
                    >
                      <X className="text-red-600" />
                    </button>
                  </div>
                )}

                <Controller
                  control={form.control}
                  name="icon"
                  render={() => (
                    <Field
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      className={
                        isDragging
                          ? "ring-2 ring-[#5865f2] rounded-md"
                          : ""
                      }
                    >
                      <FieldLabel>Icon</FieldLabel>
                      <FieldDescription>
                        We recommend at least 512x512
                      </FieldDescription>
                      <label
                        className="bg-discord-blue cursor-pointer inline-block px-3 py-2 rounded-md text-sm w-max text-center"
                        htmlFor="attachment"
                      >
                        Change server icon
                      </label>
                      <input
                        id="attachment"
                        type="file"
                        multiple={false}
                        name="attachment"
                        accept={ALLOWED_FILE_EXTENSIONS}
                        className="hidden"
                        onChange={(e) => {
                          if (!e.target.files) return;
                          const files = Array.from(e.target.files);
                          addFiles(files);
                          if (files.length > 0) {
                            form.setValue("icon", files[0].name, {
                              shouldDirty: true,
                              shouldTouch: true,
                            });
                          }
                        }}
                      />
                      {errors.length > 0 && (
                        <div
                          className="mb-2 flex flex-col gap-1"
                          role="alert"
                          aria-live="polite"
                        >
                          {errors.map((err, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs px-3 py-2 rounded-lg"
                            >
                              <X size={12} />
                              {err}
                            </div>
                          ))}
                        </div>
                      )}
                    </Field>
                  )}
                />

                <div>
                  <FieldLabel className="mb-2 block">
                    Banner
                  </FieldLabel>
                  <div className="flex flex-wrap gap-3">
                    {gradients.map((g) => (
                      <GradientSwatch
                        key={`${g[0]}-${g[1]}`}
                        colors={g}
                        selected={selected.includes(g[0])}
                        onSelect={() =>
                          form.setValue("banner", g, {
                            shouldDirty: true,
                            shouldTouch: true,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>

                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="server-description">
                        Description
                      </FieldLabel>
                      <FieldDescription>
                        How did your server get started? Why people
                        should join your server
                      </FieldDescription>
                      <textarea
                        id="server-description"
                        {...field}
                        className="w-full h-24 resize-none border border-sidebar-secondary rounded-md focus-visible:outline-none p-2"
                        placeholder="Tell people about your server..."
                      />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="private"
                  render={({ field }) => (
                    <Field>
                      <div className="flex items-center gap-5">
                        <FieldLabel htmlFor="private-profile">
                          Private profile
                        </FieldLabel>
                        <Switch
                          id="private-profile"
                          className="data-unchecked:bg-sidebar-primary data-checked:bg-discord-blue shadow"
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            form.setValue("private", checked, {
                              shouldDirty: true,
                              shouldTouch: true,
                            })
                          }
                        />
                      </div>
                      <FieldDescription className="text-sm max-w-lg">
                        When enabled, only server members can view
                        profile content. Non-members won&apos;t be
                        able to see this content unless they have an
                        invite.
                      </FieldDescription>
                    </Field>
                  )}
                />
              </div>
            )}

            {/* Save / discard bar */}
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-full sm:max-w-2xl z-20",
                "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md p-3 bg-sidebar-secondary shadow-lg",
                "transition-all ease duration-300",
                isChange || submitStatus
                  ? "bottom-4 opacity-100"
                  : "-bottom-24 opacity-0 pointer-events-none",
              )}
            >
              {submitStatus?.type === "error" ? (
                <>
                  <p className="text-red-400 text-sm">
                    {submitStatus.message}
                  </p>
                  <div className="flex gap-3 items-center">
                    <button
                      type="button"
                      className="text-sm text-gray-400 flex-1 sm:flex-none"
                      onClick={() => {
                        form.reset();
                        setSubmitStatus(null);
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 px-3 rounded py-1 text-sm flex-1 sm:flex-none"
                    >
                      Retry
                    </button>
                  </div>
                </>
              ) : submitStatus?.type === "success" ? (
                <p className="text-green-400 text-sm flex items-center gap-2 justify-center sm:justify-start">
                  <Check size={14} /> Changes saved!
                </p>
              ) : (
                <>
                  <p className="text-sm">
                    Careful! you have unsaved changes!
                  </p>
                  <div className="flex gap-3 items-center">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className="text-sm text-gray-400 disabled:opacity-50 flex-1 sm:flex-none"
                      onClick={() => form.reset()}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 px-3 rounded py-1 text-sm disabled:opacity-50 flex items-center justify-center gap-2 flex-1 sm:flex-none"
                    >
                      {isSubmitting && (
                        <Loader2
                          size={12}
                          className="animate-spin"
                        />
                      )}
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>

        <div className="order-1 lg:order-2 z-10 lg:z-0 w-full lg:w-auto lg:sticky lg:top-5 shrink-0">
          <ServerProfilePreview selected={selected} server={data} />
        </div>
      </div>
    </div>
  );
}
