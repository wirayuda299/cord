"use server";

import { getPublicApiUrl } from "@/lib/env";
import { revalidateTag } from "next/cache";

export async function uploadImage(file: File) {
  try {
    const base = getPublicApiUrl();
    const formData = new FormData();
    formData.append("attachment", file);

    const res = await fetch(`${base}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const response = await res.json();
    revalidateTag("messages", "max");
    return response.data;
  } catch (e) {
    throw e;
  }
}
