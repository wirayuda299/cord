'use server'

import { getPublicApiUrl } from "@/lib/env";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";


export async function deleteThread(thread_id: string, server_id: string) {
    try {

        const { getToken } = await auth()
        const token = await getToken()
        const res = await fetch(`${getPublicApiUrl()}/threads/delete`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                thread_id,
                server_id
            })
        });

        if (!res.ok) {
            console.error("failed to delete thread -> ", await res.text())
            return {
                error: "Failed to delete thread",
            }
        }

        revalidateTag('messages', { expire: 0 })

    } catch (err) {
        throw err
    }
}