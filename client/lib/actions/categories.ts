"use server";

import { getPublicApiUrl } from "@/lib/env";
import type { CreateCategoryPayload } from "@/types/category";
import { APIResponse } from "@/types/response";
import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";

export async function createCategory(
   payload: CreateCategoryPayload,
): Promise<APIResponse> {
   const { getToken } = await auth.protect();
   const token = await getToken();

   if (!token) {
      return {
         message: "unauthorized",
         success: false,
      };
   }

   if (
      !payload.name ||
      !payload.server_id ||
      typeof payload.name !== "string" ||
      typeof payload.server_id !== "string"
   ) {
      return {
         message: "invalid payload",
         success: false,
      };
   }

   try {
      const res = await fetch(`${getPublicApiUrl()}/categories`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify(payload),
      });

      const data: APIResponse = await res.json().catch(() => null);
      if (!res.ok) {
         return {
            message: data.message ?? "failed to create category",
            success: false,
         };
      }
      if (res.ok && data.success) {
         updateTag("channels");
      }
      return {
         message: "category created",
         success: true,
      };
   } catch (e) {
      console.error("failed to create category -> " + e);
      return {
         message: "failed to create category",
         success: false,
      };
   }
}
