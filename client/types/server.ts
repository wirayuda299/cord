export type ServerListItem = {
  id: string;
  name: string;
  logo: string;
};

export type BrowsableServer = {
  id: string;
  name: string;
  logo: string;
  member_count: number;
};


export type Member = {
   id: string;
   user_id: string;
   username: string;
   avatar_url: string;
   avatar_id: string;
   joined_at: string; // ISO date string
   role: string | null;
   role_id: string | null;
   role_color: string | null;
   server_id: string;
   is_banned?: boolean;
};
