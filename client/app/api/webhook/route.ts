import { UserJSON, WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("[webhook] CLERK_WEBHOOK_SIGNING_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[webhook] Missing svix headers");
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("[webhook] Received event type:", evt.type);

  if (evt.type === "user.created") {
    console.log("user created event triggered -> ", evt.data);
    const { id, username, image_url, email_addresses } = evt.data as UserJSON;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

    try {
      const res = await fetch(`${apiUrl}/users/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          username: username,
          avatar_url: image_url ?? "",
          avatar_id: "",
          bio: "",
          email_verified:
            email_addresses?.[0]?.verification?.status ?? "unverified",
        }),
      });

      const responseText = await res.text();
      console.log("[webhook] Backend response:", res.status, responseText);

      if (!res.ok) {
        console.error(
          "[webhook] Backend rejected user creation:",
          res.status,
          responseText,
        );
        return new Response(`Backend error: ${responseText}`, {
          status: 500,
        });
      }

      return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (err) {
      console.error("[webhook] Failed to reach backend:", err);
      return new Response("Failed to create user", { status: 500 });
    }
  }

  console.log("[webhook] Unhandled event type:", evt.type);
  return new Response("OK", { status: 200 });
}
