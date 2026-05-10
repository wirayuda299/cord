import type { Channel } from "@/lib/types/channel";

export type Conversation = {
  channel_id: string;
  channel_type: "dm" | "group_dm";
  name: string;
  other_user_id: string;
  other_username: string;
  other_avatar_url: string;
  last_message_content: string;
  last_message_at: string;
};

export type ConversationDetail = Channel & {
  other_user_id: string;
  other_username: string;
  other_avatar_url: string;
};
