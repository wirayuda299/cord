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

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    let active = true;

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
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active || wsRef.current !== ws) return;
        setStatus("connected");
      };

      ws.onmessage = (e) => {
        if (!active || wsRef.current !== ws) return;

        try {
          const data = JSON.parse(e.data);
          if (data.type === "message_deleted") {
            optionsRef.current.onDelete?.(data.id);
          } else {
            optionsRef.current.onMessage(data);
          }
        } catch (e) {
          console.log(e)
          // Failed to parse WebSocket message
        }
      };

      ws.onclose = (e) => {
        if (!active || wsRef.current !== ws) return;

        setStatus("disconnected");
        optionsRef.current.onClose?.();
        if (e.code !== 1000 && e.code !== 1001) {
          reconnectTimeout.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        if (!active || wsRef.current !== ws) return;

        setStatus("error");
        ws.close();
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
