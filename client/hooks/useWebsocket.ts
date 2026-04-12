"use client";

import { getPublicWsUrl } from "@/lib/env";
import type { ResponseMessage } from "@/lib/types/chat";
import { useCallback, useEffect, useRef, useState } from "react";

export type { Message } from "@/lib/types/chat";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

type Options = {
  onMessage: (msg: ResponseMessage) => void;
  onDelete?: (id: string) => void;
  onClose?: () => void;
  onError?: (e: Event) => void;
};

export function useWebSocket(
  serverId: string,
  channelId: string,
  options: Options
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef(options);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  optionsRef.current = options;

  useEffect(() => {
    function connect() {
      setStatus("connecting");

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(
        `${getPublicWsUrl()}/ws?serverId=${serverId}&channelId=${channelId}`
      );

      ws.onopen = () => {
        setStatus("connected");
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "message_deleted") {
            optionsRef.current.onDelete?.(data.id);
          } else {
            optionsRef.current.onMessage(data);
          }
        } catch {
          // Failed to parse WebSocket message
        }
      };

      ws.onclose = (e) => {
        setStatus("disconnected");
        optionsRef.current.onClose?.();
        if (e.code !== 1000 && e.code !== 1001) {
          reconnectTimeout.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        setStatus("error");
        ws.close();
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      wsRef.current?.close(1000, "cleanup");
      wsRef.current = null;
    };
  }, [serverId, channelId]);

  const sendMessage = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
    // Message not sent if WebSocket is not connected
  }, []);

  return { sendMessage, status };
}
