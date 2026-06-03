"use server";

import { getPublicApiUrl } from "@/lib/env";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";

export async function uploadImage(file: File) {
  try {
    const base = getPublicApiUrl();
    const formData = new FormData();
    formData.append("attachment", file);

    const { getToken } = await auth()
    const token = await getToken()
    const res = await fetch(`${base}/image/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData,
    });
    const response = await res.json();
    revalidateTag("messages", "max");
    return response.data;
  } catch (e) {
    throw e;
  }
}

export async function deleteImage(publicId: string) {
  const base = getPublicApiUrl();
  const { getToken } = await auth()
  const token = await getToken()

  await fetch(`${base}/image/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(publicId),
  });
}
