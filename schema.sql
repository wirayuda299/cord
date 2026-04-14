
CREATE SCHEMA "public";

CREATE TYPE "channeltype" AS ENUM('text', 'audio');
CREATE TYPE "message_type" AS ENUM('channel', 'personal', 'threads', 'reply');
CREATE TABLE "banned_members" (
	"member_id" varchar(100),
	"server_id" varchar(100),
	"banned_by" varchar(100),
	CONSTRAINT "banned_members_pkey" PRIMARY KEY("member_id","server_id","banned_by")
);
CREATE TABLE "categories" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(50) NOT NULL,
	"server_id" varchar(100)
);

CREATE TABLE "channel_messages" (
	"message_id" varchar(100),
	"channel_id" varchar(100),
	CONSTRAINT "channel_messages_pkey" PRIMARY KEY("message_id","channel_id")
);


CREATE TABLE "channel_pinned_messages" (
	"message_id" varchar(100),
	"channel_id" varchar(100),
	"pinned_by" varchar(100),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "channel_pinned_messages_pkey" PRIMARY KEY("message_id","channel_id","pinned_by")
);
CREATE TABLE "channels" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"server_id" varchar(100) NOT NULL,
	"name" varchar(50) NOT NULL,
	"type" channeltype,
	"topic" varchar(50) DEFAULT ''
);
CREATE TABLE "channels_category" (
	"channel_id" varchar(100),
	"category_id" varchar(100),
	CONSTRAINT "channels_category_pkey" PRIMARY KEY("channel_id","category_id")
);


CREATE TABLE "conversations" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"recipient_id" varchar(100) NOT NULL,
	"sender_id" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "friends" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" varchar(100) NOT NULL UNIQUE,
	"friend_id" varchar(100) NOT NULL UNIQUE,
	CONSTRAINT "friends_user_id_friend_id_key" UNIQUE("user_id","friend_id")
);
CREATE TABLE "invitations" (
	"user_to_invite" varchar(100),
	"invitator" varchar(100),
	"status" varchar(50) DEFAULT 'pending',
	CONSTRAINT "invitations_pkey" PRIMARY KEY("user_to_invite","invitator")
);
CREATE TABLE "members" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"server_id" varchar(100) NOT NULL UNIQUE,
	"user_id" varchar(100) NOT NULL UNIQUE,
	CONSTRAINT "members_server_id_user_id_key" UNIQUE("server_id","user_id")
);
CREATE TABLE "messages" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"content" text,
	"is_read" boolean DEFAULT false,
	"user_id" varchar(100) NOT NULL,
	"image_url" text,
	"type" message_type,
	"image_asset_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "messages_replies" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"parent_message_id" varchar(100) NOT NULL,
	"message_id" varchar(100) NOT NULL,
	"author" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "permissions" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"manage_channel" boolean DEFAULT false,
	"manage_role" boolean DEFAULT false,
	"kick_member" boolean DEFAULT false,
	"ban_member" boolean DEFAULT false,
	"attach_file" boolean DEFAULT false,
	"manage_thread" boolean DEFAULT false,
	"manage_message" boolean DEFAULT false,
	"server_id" varchar(100) NOT NULL
);
CREATE TABLE "personal_messages" (
	"conversation_id" varchar(100),
	"message_id" varchar(100),
	CONSTRAINT "personal_messages_pkey" PRIMARY KEY("conversation_id","message_id")
);
CREATE TABLE "personal_pinned_messages" (
	"message_id" varchar(100),
	"pinned_by" varchar(100),
	"conversation_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "personal_pinned_messages_pkey" PRIMARY KEY("message_id","pinned_by","conversation_id")
);
CREATE TABLE "reactions" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"message_id" varchar(100) NOT NULL,
	"emoji" text,
	"unified_emoji" text,
	"react_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "role_permissions" (
	"role_id" varchar(100) NOT NULL,
	"permission_id" varchar(100) NOT NULL
);
CREATE TABLE "roles" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(50) NOT NULL,
	"server_id" varchar(100) NOT NULL,
	"icon_asset_id" varchar(100),
	"role_color" varchar(20) DEFAULT '#99aab5',
	"icon" varchar(255)
);
CREATE TABLE "server_profile" (
	"server_id" varchar(100),
	"user_id" varchar(100),
	"username" varchar(100) NOT NULL,
	"avatar" text DEFAULT '' NOT NULL,
	"avatar_asset_id" varchar(100),
	"bio" text,
	CONSTRAINT "server_profile_pkey" PRIMARY KEY("server_id","user_id")
);
CREATE TABLE "server_settings" (
	"server_id" varchar(100) PRIMARY KEY,
	"show_banner_background" boolean DEFAULT false,
	"show_progress_bar" boolean DEFAULT false
);
CREATE TABLE "servers" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(25) NOT NULL,
	"logo" varchar(255) NOT NULL,
	"logo_asset_id" varchar(255) NOT NULL,
	"owner_id" varchar(100),
	"banner" varchar(255),
	"level" integer DEFAULT 0,
	"banner_asset_id" varchar(255),
	"invite_code" varchar(100) DEFAULT uuid_generate_v4(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"level_progress" integer DEFAULT 0,
	"boost_count" integer DEFAULT 0
);
CREATE TABLE "thread_messages" (
	"message_id" varchar(100),
	"thread_id" varchar(100),
	CONSTRAINT "thread_messages_pkey" PRIMARY KEY("message_id","thread_id")
);
CREATE TABLE "thread_messages_replies" (
	"parent_message_id" varchar(100),
	"message_id" varchar(100),
	"thread_id" varchar(100),
	CONSTRAINT "thread_messages_replies_pkey" PRIMARY KEY("message_id","thread_id","parent_message_id")
);
CREATE TABLE "threads" (
	"id" varchar(100) PRIMARY KEY DEFAULT uuid_generate_v4(),
	"message_id" varchar(100) NOT NULL,
	"author" varchar(100) NOT NULL,
	"name" varchar(50),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"channel_id" varchar(100) NOT NULL
);
CREATE TABLE "user_roles" (
	"role_id" varchar(100),
	"user_id" varchar(100) NOT NULL,
	"permission_id" varchar(100),
	CONSTRAINT "user_roles_pkey" PRIMARY KEY("role_id","permission_id")
);
CREATE TABLE "users" (
	"id" varchar(100) PRIMARY KEY,
	"username" varchar(30) NOT NULL CONSTRAINT "users_username_key" UNIQUE,
	"email" varchar(255) NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"image" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"bio" varchar(50) DEFAULT '',
	"image_asset_id" text DEFAULT ''
);
CREATE UNIQUE INDEX "banned_members_pkey" ON "banned_members" ("member_id","server_id","banned_by");
CREATE UNIQUE INDEX "categories_pkey" ON "categories" ("id");
CREATE UNIQUE INDEX "channel_messages_pkey" ON "channel_messages" ("message_id","channel_id");
CREATE UNIQUE INDEX "channel_pinned_messages_pkey" ON "channel_pinned_messages" ("message_id","channel_id","pinned_by");
CREATE UNIQUE INDEX "channels_pkey" ON "channels" ("id");
CREATE UNIQUE INDEX "channels_category_pkey" ON "channels_category" ("channel_id","category_id");
CREATE UNIQUE INDEX "conversations_pkey" ON "conversations" ("id");
CREATE UNIQUE INDEX "friends_pkey" ON "friends" ("id");
CREATE UNIQUE INDEX "friends_user_id_friend_id_key" ON "friends" ("user_id","friend_id");
CREATE INDEX "idx_friends_friend_id" ON "friends" ("friend_id");
CREATE INDEX "idx_friends_user_id" ON "friends" ("user_id");
CREATE UNIQUE INDEX "invitations_pkey" ON "invitations" ("user_to_invite","invitator");
CREATE UNIQUE INDEX "members_pkey" ON "members" ("id");
CREATE UNIQUE INDEX "members_server_id_user_id_key" ON "members" ("server_id","user_id");
CREATE UNIQUE INDEX "messages_pkey" ON "messages" ("id");
CREATE UNIQUE INDEX "messages_replies_pkey" ON "messages_replies" ("id");
CREATE UNIQUE INDEX "permissions_pkey" ON "permissions" ("id");
CREATE UNIQUE INDEX "personal_messages_pkey" ON "personal_messages" ("conversation_id","message_id");
CREATE UNIQUE INDEX "personal_pinned_messages_pkey" ON "personal_pinned_messages" ("message_id","pinned_by","conversation_id");
CREATE UNIQUE INDEX "reactions_pkey" ON "reactions" ("id");
CREATE UNIQUE INDEX "roles_pkey" ON "roles" ("id");
CREATE UNIQUE INDEX "server_profile_pkey" ON "server_profile" ("server_id","user_id");
CREATE UNIQUE INDEX "server_settings_pkey" ON "server_settings" ("server_id");
CREATE UNIQUE INDEX "servers_pkey" ON "servers" ("id");
CREATE UNIQUE INDEX "thread_messages_pkey" ON "thread_messages" ("message_id","thread_id");
CREATE UNIQUE INDEX "thread_messages_replies_pkey" ON "thread_messages_replies" ("message_id","thread_id","parent_message_id");
CREATE UNIQUE INDEX "threads_pkey" ON "threads" ("id");
CREATE UNIQUE INDEX "user_roles_pkey" ON "user_roles" ("role_id","permission_id");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_pkey" ON "users" ("id");
CREATE UNIQUE INDEX "users_username_key" ON "users" ("username");
ALTER TABLE "banned_members" ADD CONSTRAINT "fk_banned_id" FOREIGN KEY ("banned_by") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "banned_members" ADD CONSTRAINT "fk_member_id" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "banned_members" ADD CONSTRAINT "fk_server_id" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "fk_server_id" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE;
ALTER TABLE "channel_messages" ADD CONSTRAINT "fk_channel_id" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE;
ALTER TABLE "channel_messages" ADD CONSTRAINT "fk_message_id" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "channel_pinned_messages" ADD CONSTRAINT "fk_channel_id" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE;
ALTER TABLE "channel_pinned_messages" ADD CONSTRAINT "fk_message_id" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "channel_pinned_messages" ADD CONSTRAINT "fk_pinned_id" FOREIGN KEY ("pinned_by") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "channels" ADD CONSTRAINT "fk_server_id" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE;
ALTER TABLE "channels_category" ADD CONSTRAINT "fk_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE;
ALTER TABLE "channels_category" ADD CONSTRAINT "fk_channel_id" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "fk_recipient_id" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "fk_sender_id" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "friends" ADD CONSTRAINT "fk_friend_id" FOREIGN KEY ("friend_id") REFERENCES "users"("id");
ALTER TABLE "friends" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "invitations" ADD CONSTRAINT "fk_invitator" FOREIGN KEY ("invitator") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "fk_user_to_invite" FOREIGN KEY ("user_to_invite") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "members" ADD CONSTRAINT "fk_server_id" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE;
ALTER TABLE "members" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "messages_replies" ADD CONSTRAINT "fk_message_id" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "messages_replies" ADD CONSTRAINT "fk_parent_message_id" FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "messages_replies" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("author") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "permissions" ADD CONSTRAINT "fk_server_id" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE;
ALTER TABLE "personal_messages" ADD CONSTRAINT "fk_conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
ALTER TABLE "personal_messages" ADD CONSTRAINT "fk_message_id" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "personal_pinned_messages" ADD CONSTRAINT "fk_conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
ALTER TABLE "personal_pinned_messages" ADD CONSTRAINT "fk_message_id" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "personal_pinned_messages" ADD CONSTRAINT "fk_pinned_id" FOREIGN KEY ("pinned_by") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reactions" ADD CONSTRAINT "fk_message_id" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "reactions" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("react_by") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;
ALTER TABLE "roles" ADD CONSTRAINT "fk_server_id" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE;
ALTER TABLE "server_profile" ADD CONSTRAINT "fk_server_id" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE;
ALTER TABLE "server_profile" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "server_settings" ADD CONSTRAINT "fk_server_id" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE;
ALTER TABLE "servers" ADD CONSTRAINT "fk_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "thread_messages" ADD CONSTRAINT "fk_message_id" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "thread_messages" ADD CONSTRAINT "fk_thread_id" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE CASCADE;
ALTER TABLE "thread_messages_replies" ADD CONSTRAINT "fk_message_id" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "thread_messages_replies" ADD CONSTRAINT "fk_parent_message_id" FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "thread_messages_replies" ADD CONSTRAINT "fk_thread_id" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE CASCADE;
ALTER TABLE "threads" ADD CONSTRAINT "fk_channel_id" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE;
ALTER TABLE "threads" ADD CONSTRAINT "fk_message_id" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
ALTER TABLE "threads" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("author") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
