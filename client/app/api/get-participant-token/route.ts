import { auth } from "@clerk/nextjs/server";
import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getPublicApiUrl } from "@/lib/env";

export async function GET(req: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");
  const serverId = req.nextUrl.searchParams.get("serverId");

  if (!room) {
    return NextResponse.json(
      { error: 'Missing "room" query parameter' },
      { status: 400 },
    );
  } else if (!username) {
    return NextResponse.json(
      { error: 'Missing "username" query parameter' },
      { status: 400 },
    );
  } else if (!serverId) {
    return NextResponse.json(
      { error: 'Missing "serverId" query parameter' },
      { status: 400 },
    );
  }

  const token = await getToken();
  try {
    const membershipRes = await fetch(
      `${getPublicApiUrl()}/channel?channelId=${room}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
    if (!membershipRes.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { data: channel } = await membershipRes.json();
    if (channel?.server_id && channel.server_id !== serverId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const at = new AccessToken(apiKey, apiSecret, { identity: username });

  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

  return NextResponse.json({ token: await at.toJwt() });
}
