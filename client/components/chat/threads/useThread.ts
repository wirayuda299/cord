import { useState, useCallback } from "react";
import type { Message } from "@/lib/types/chat";

export type ThreadState = {
   parentMessage: Message | null;
   threadMessages: Message[];
   isOpen: boolean;
};

export function useThread() {
   const [threadState, setThreadState] = useState<ThreadState>({
      parentMessage: null,
      threadMessages: [],
      isOpen: false,
   });

   const openThread = useCallback((parentMessage: Message) => {
      setThreadState({
         parentMessage,
         threadMessages: [], // In a real app, fetch existing thread messages
         isOpen: true,
      });
   }, []);

   const closeThread = useCallback(() => {
      setThreadState({
         parentMessage: null,
         threadMessages: [],
         isOpen: false,
      });
   }, []);

   const addThreadMessage = useCallback((message: Message) => {
      setThreadState((prev) => ({
         ...prev,
         threadMessages: [...prev.threadMessages, message],
      }));
   }, []);

   const removeThreadMessage = useCallback((messageId: string) => {
      setThreadState((prev) => ({
         ...prev,
         threadMessages: prev.threadMessages.filter((msg) => msg.id !== messageId),
      }));
   }, []);

   return {
      threadState,
      openThread,
      closeThread,
      addThreadMessage,
      removeThreadMessage,
   };
}
