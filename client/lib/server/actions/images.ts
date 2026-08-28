"use server";

import { getPublicApiUrl } from "@/lib/env";
import { APIResponse } from "@/lib/types/response";
import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";

export async function uploadImage(
  file: File
): Promise<APIResponse<{ url: string; public_id: string }>> {
  const { getToken } = await auth.protect()

  try {
    const formData = new FormData()
    formData.append("attachment", file)

    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/image/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const response: APIResponse<{
      url: string
      public_id: string
    }> | null = await res.json().catch(() => null)

    if (!response) {
      return {
        success: false,
        message: "Invalid response from server",
      }
    }

    if (!res.ok || !response.success) {
      return {
        success: false,
        message: response.message ?? "Failed to upload image",
      }
    }

    if (!response.data) {
      return {
        success: false,
        message: "Upload succeeded but response data is missing",
      }
    }

    updateTag("messages")

    return response
  } catch (error) {
    console.error("Failed to upload image:", error)

    return {
      success: false,
      message: "Failed to upload image",
    }
  }
}
export async function deleteImage(publicId: string): Promise<APIResponse> {
  const { getToken } = await auth.protect()
  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/image/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(publicId),
    });

    const response: APIResponse = await res.json()
    if (!res.ok) {
      return {
        message: "failed to delete image",
        success: false
      }
    }

    if (!response.success) {
      return {
        message: response.message,
        success: false
      }
    }
    return {
      message: "image deleted",
      success: true
    }
  } catch (e) {
    return {
      success: false,
      message: "failed to delete image"
    }
  }
}
