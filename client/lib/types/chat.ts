export type Message = {
  id: string;
  content: string;
  user_id: string;
  username: string;
  avatar: string;
  image_url: string;
  image_asset_id: string;
  channel_id: string;
  created_at: string;
  updated_at: string;
  parent_msg_id: string | null;
  parent_content: string | null;
  parent_username: string | null;
};

export type ResponseMessage = {
  channel_id: string;
  server_id: string;
  messages: Message[];
};

export type PinnedMessage = {
  id: string;
  username: string;
  content: string;
  user_id: string;
};
