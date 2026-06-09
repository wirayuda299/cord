import { getPublicApiUrl } from "@/lib/env"
import { auth } from "@clerk/nextjs/server"

export async function isUserJoin(server_id: string): Promise<boolean> {
  try {

    const res = await fetch(`${getPublicApiUrl()}/members/is-join?server_id=${server_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${await (await auth()).getToken()}`
      },
    })


    return await res.json().then(d => d.data)
  } catch (e) {
    throw e
  }
}
