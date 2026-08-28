import { getPublicApiUrl } from "./env";
import { APIResponse } from "./types/response";
import { getToken } from "@clerk/nextjs"

export async function apiFetcher<T>(path: string): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${getPublicApiUrl()}/${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Authorization": `Bearer ${token}`
    },
  })

  const payload: APIResponse<T> = await res.json().catch(() => ({
    success: false,
    message: "Invalid response from server",
  }))

  if (!res.ok || !payload.success) {
    const error = new Error(
      payload.message || "Request failed"
    )

    throw error
  }

  return payload.data as T
}
export { cn } from "@/lib/shared/utils";
