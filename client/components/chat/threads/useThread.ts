"use client";

import { useState, useCallback } from "react";
import type { Message } from "@/lib/types/chat";

export type ThreadState = {
   parentMessage: Message | null;
   threadMessages: Message[];
   isOpen: boolean;
   isLoading: boolean;
};

export function useThread() {
   const [threadState, setThreadState] = useState<ThreadState>({
      parentMessage: null,
      threadMessages: [],
      isOpen: false,
      isLoading: false,
   });

   const openThread = useCallback(async (parentMessage: Message, fetchThread?: (parentId: string) => Promise<Message[] | { error: unknown }>) => {
      setThreadState({
         parentMessage,
         threadMessages: [],
         isOpen: true,
         isLoading: true,
      });

      if (fetchThread) {
         try {
            const result = await fetchThread(parentMessage.id);
            if (Array.isArray(result)) {
               setThreadState((prev) => ({
                  ...prev,
                  threadMessages: result,
                  isLoading: false,
               }));
            } else {
               setThreadState((prev) => ({
                  ...prev,
                  isLoading: false,
               }));
            }
         } catch {
            setThreadState((prev) => ({
               ...prev,
               isLoading: false,
            }));
         }
      } else {
         setThreadState((prev) => ({
            ...prev,
            isLoading: false,
         }));
      }
   }, []);

   const closeThread = useCallback(() => {
      setThreadState({
         parentMessage: null,
         threadMessages: [],
         isOpen: false,
         isLoading: false,
      });
   }, []);

   const setThreadMessages = useCallback((messages: Message[]) => {
      setThreadState((prev) => ({
         ...prev,
         threadMessages: messages,
      }));
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
      setThreadMessages,
      addThreadMessage,
      removeThreadMessage,
   };
}
