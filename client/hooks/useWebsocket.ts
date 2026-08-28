"use client";

import { getPublicWsUrl } from "@/lib/env";
import type { ResponseMessage } from "@/lib/types/chat";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

export type { Message } from "@/lib/types/chat";

export type ConnectionStatus =
   | "connecting"
   | "connected"
   | "disconnected"
   | "error";

type Options = {
   onMessage: (msg: ResponseMessage) => void;
   onDelete?: (id: string) => void;
   onEvent?: (event: unknown) => void;
   onClose?: () => void;
   onError?: (e: Event) => void;
};

export function useWebSocket(
   serverId: string,
   channelId: string,
   options: Options,
) {
   const { getToken } = useAuth();
   const wsRef = useRef<WebSocket | null>(null);
   const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
   const optionsRef = useRef(options);
   const [status, setStatus] = useState<ConnectionStatus>("connecting");

   useEffect(() => {
      optionsRef.current = options;
   }, [options]);

   useEffect(() => {
      let active = true;

      async function connect() {
         setStatus("connecting");

         if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
         }

         if (wsRef.current) {
            wsRef.current.close();
         }

         const token = await getToken();
         if (!token) {
            setStatus("error");
            return;
         }

         const ws = new WebSocket(
            `${getPublicWsUrl()}/ws?serverId=${serverId}&channelId=${channelId}&token=${token}`,
         );
         wsRef.current = ws;

         ws.onopen = () => {
            if (!active || wsRef.current !== ws) return;
            setStatus("connected");
         };

         ws.onmessage = (e) => {
            if (!active || wsRef.current !== ws) return;

            const raw = typeof e.data === "string" ? e.data : "";
            // server may send multiple JSON objects separated by newlines
            const parts = raw
               .split("\n")
               .map((s) => s.trim())
               .filter(Boolean);

            for (const part of parts) {
               try {
                  const data = JSON.parse(part);
                  if (data && data.type === "message_deleted") {
                     optionsRef.current.onDelete?.(data.id);
                  } else if (data && data.type !== undefined) {
                     optionsRef.current.onEvent?.(data);
                  } else {
                     optionsRef.current.onMessage(data);
                  }
               } catch (err) {
                  console.warn("ws: failed to parse message part", err, part);
               }
            }
         };
      }

      connect();

      return () => {
         active = false;
         if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
         }
         const ws = wsRef.current;
         wsRef.current = null;
         ws?.close(1000, "cleanup");
      };
   }, [serverId, channelId]);

   const sendMessage = useCallback((msg: object): boolean => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return false;
      try {
         wsRef.current.send(JSON.stringify(msg));
         return true;
      } catch {
         return false;
      }
   }, []);

   return { sendMessage, status };
}
