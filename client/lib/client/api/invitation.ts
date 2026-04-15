import { getPublicApiUrl } from "@/lib/env";

export async function deleteInvitationCode(code: string, deleted_by: string) {
  const base = getPublicApiUrl()

  const res = await fetch(`${base}/invitation/delete`, {
    method: "DELETE",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({
      code,
      deleted_by
    })
  })

  if (!res.ok) {
    throw new Error("Failed to delete invitation code")
  }
}
