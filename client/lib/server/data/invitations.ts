'server-only'

import { getPublicApiUrl } from "@/lib/env"
import { Invitation } from "@/lib/types/invitation"
import { auth } from "@clerk/nextjs/server"

export async function findInvitationByCode(code: string): Promise<Invitation> {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/invitation/find-one?code=${code}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },

    })

    if (!res.ok) {
      throw new Error("Failed to fetch invitation")
    }

    return await res.json().then(d => d.data)
  } catch (e) {
    throw e
  }

}
