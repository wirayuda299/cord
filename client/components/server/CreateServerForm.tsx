"use client";

import { Edit, ImagePlus, Loader2, Plus } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { createServer } from "@/lib/actions/servers";
import { uploadImage } from "@/lib/actions/images";
import { Controller, useForm } from "react-hook-form";
import {
   createServerSchema,
   type CreateServerSchemaType,
} from "@/lib/validations/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAttachedFiles } from "@/hooks/useAttachedFiles";
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/file-validation";
import { toast } from "@/components/ui/toast";

export default function CreateServerForm() {
   const {
      attachedFiles,
      addFiles,
      isDragging,
      onDragOver,
      onDragLeave,
      onDrop,
   } = useAttachedFiles();
   const preview = attachedFiles[0]?.preview ?? null;

   const form = useForm<CreateServerSchemaType>({
      resolver: zodResolver(createServerSchema as any),
      defaultValues: { name: "" },
   });
   // React Hook Form flips this to true for the whole duration of the async
   // handleSubmit callback below (icon upload + create call), so it doesn't
   // need its own separate useState.
   const { isSubmitting } = form.formState;

   const handleSubmit = async (data: CreateServerSchemaType) => {
      if (!data.name.trim()) return;

      let iconUrl = "";
      let iconAssetId = "";

      // The icon is cosmetic ("you can always change it later"), so a failed
      // upload shouldn't block creating the server — warn and continue
      // without it rather than silently dropping it with no feedback at all
      // (which is what happened before: the attached file was never sent).
      if (attachedFiles.length > 0) {
         const uploaded = await uploadImage(attachedFiles[0].file);
         if (uploaded.success && uploaded.data) {
            iconUrl = uploaded.data.url;
            iconAssetId = uploaded.data.public_id;
         } else {
            toast.add({
               title: uploaded.message || "Failed to upload server icon",
               type: "error",
            });
         }
      }

      const res = await createServer(data.name, iconUrl, iconAssetId);
      if (res && !res.success) {
         toast.add({ title: res.message, type: "error" });
         return;
      }
      toast.add({ title: "Server created", type: "success" });
   };

   return (
      <Dialog>
         <DialogTrigger className="w-12 group flex items-center justify-center h-12 rounded-[50%] hover:rounded-[20%] transition-all ease duration-300 text-(--discord-green) bg-(--server-item) hover:bg-(--discord-green)">
            <Plus className="text-(--discord-green) group-hover:text-white" />
         </DialogTrigger>
         <DialogContent
            onKeyDown={(e) => e.stopPropagation()}
            showCloseButton={false}
            className="bg-sidebar-secondary border-none text-white max-w-md p-0 overflow-hidden"
         >
            <form onSubmit={form.handleSubmit(handleSubmit)}>
               <div className="flex flex-col items-center gap-4 pt-8 px-6">
                  <label
                     className={`group ${isSubmitting ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
                     onDragOver={onDragOver}
                     onDragLeave={onDragLeave}
                     onDrop={onDrop}
                  >
                     <input
                        id="file"
                        type="file"
                        accept={ALLOWED_FILE_EXTENSIONS}
                        className="hidden"
                        disabled={isSubmitting}
                        onChange={(e) =>
                           e.target.files &&
                           addFiles(Array.from(e.target.files))
                        }
                     />
                     <div
                        className={`w-20 h-20 rounded-full relative border-2 border-dashed transition-colors flex items-center justify-center overflow-hidden ${
                           isDragging
                              ? "border-indigo-400 bg-indigo-400/10"
                              : "border-gray-500 group-hover:border-indigo-400"
                        }`}
                     >
                        {preview ? (
                           <>
                              <Image
                                 src={preview}
                                 alt="Server icon"
                                 width={80}
                                 height={80}
                                 className="object-cover w-full h-full"
                              />
                              <div className="absolute left-0 bg-sidebar-secondary/50 h-full justify-center group-hover:opacity-100 opacity-0 right-0 flex items-center transition-all ease-in-out">
                                 <Edit className="text-sidebar-secondary" />
                              </div>
                           </>
                        ) : (
                           <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-indigo-400 transition-colors">
                              <ImagePlus size={22} />
                              <span className="text-[10px] font-semibold uppercase">
                                 {isDragging ? "Drop here" : "Upload"}
                              </span>
                           </div>
                        )}
                     </div>
                  </label>

                  <DialogHeader className="text-center space-y-1">
                     <DialogTitle className="text-white text-xl font-bold">
                        Customize your server
                     </DialogTitle>
                     <p className="text-gray-400 text-sm">
                        Give your server a name and an icon. You can always
                        change it later.
                     </p>
                  </DialogHeader>
               </div>

               <div className="px-6 pb-6 mt-2 flex flex-col gap-4">
                  <Controller
                     control={form.control}
                     name="name"
                     render={({ field }) => (
                        <Field className="flex flex-col gap-1.5">
                           <FieldLabel className="text-xs font-bold uppercase text-gray-300">
                              Server Name{" "}
                              <span className="text-red-400">*</span>
                           </FieldLabel>
                           <Input
                              {...field}
                              autoComplete="off"
                              placeholder="Enter server name"
                              disabled={isSubmitting}
                              className="bg-bg-input border-none text-white placeholder-gray-500 focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:opacity-60"
                           />
                        </Field>
                     )}
                  />

                  <p className="text-xs text-gray-500">
                     By creating a server, you agree to Discord&apos;s{" "}
                     <span className="text-indigo-400 cursor-pointer hover:underline">
                        Community Guidelines
                     </span>
                     .
                  </p>

                  <div className="flex justify-between items-center pt-2">
                     <DialogClose
                        type="button"
                        disabled={isSubmitting}
                        className="text-gray-300 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
                     >
                        Back
                     </DialogClose>
                     <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isSubmitting ? (
                           <>
                              <Loader2 size={14} className="animate-spin" />
                              Creating...
                           </>
                        ) : (
                           "Create"
                        )}
                     </Button>
                  </div>
               </div>
            </form>
         </DialogContent>
      </Dialog>
   );
}
