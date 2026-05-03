create table users(
   id varchar(100) primary key not null,
   username varchar(50) not null,
   avatar_url text,
   bio text;
   avatar_id varchar(100),
   created_at timestamp default now(),
   updated_at timestamp default now()
);

create table servers(
   id uuid primary key default uuid_generate_v4(),
   name varchar(25) not null,
   logo text,
   banner_colors varchar(20)[]  DEFAULT '{"#FFFFFF", "#000000"}',
   description text,
   banner text default '',
   banner_id varchar(100) default '',
   private boolean default false;
   logo_id varchar(100),
   created_by varchar(100) references users(id) on delete cascade,
   created_at timestamp default now(),
   updated_at timestamp default now()
);
--
create index concurrently idx_server_name on servers(name);


create table category(
   id uuid primary key default uuid_generate_v4(),
   name varchar(25) not null,
   server_id uuid not null,
   created_by varchar(100) not null,
   created_at timestamp default now(),
   updated_at timestamp default now()
);
--
create index concurrently idx_category_server_id on category(server_id);

create type channel_types as enum('text', 'audio', 'forum');

create table channels(
   id uuid primary key default uuid_generate_v4(),
   name varchar(25) not null,
   topic text default '',
   server_id UUID NOT NULL REFERENCES servers(id) on delete cascade,
   channel_type channel_types not null default 'text',
   category_id uuid references category(id) on delete cascade,
   server_id uuid not null references servers(id) on delete cascade,
   created_at timestamp default now(),
   updated_at timestamp default now(),
   created_by varchar(100) not null references users(id) on delete cascade
);


create table members (
   id uuid primary key default uuid_generate_v4(),
   user_id varchar(100) not null references users(id) on delete cascade,
   server_id uuid not null references servers(id) on delete cascade,
   joined_at timestamp default now()
);
create index concurrently idx_members_server_id on members(server_id);


create table messages(
   id uuid primary key default uuid_generate_v4(),
   content text,
   user_id varchar(100) not null references users(id) on delete cascade,
   image_url text,
   image_asset_id varchar(100),
   channel_id uuid not null references channels(id) on delete cascade,
   parent_msg_id uuid,
   created_at timestamp default now(),
   updated_at timestamp default now()
);

create index concurrently idx_messages_context on messages(content);
create index concurrently idx_messages_parent_id on messages(parent_msg_id);

create table threads (
   id uuid primary key default uuid_generate_v4(),

   -- the channel where the thread was created
   channel_id uuid not null references channels(id) on delete cascade,

   -- the original/root message that started the thread
   starter_message_id uuid not null unique references messages(id) on delete cascade,

   name varchar(255),
   created_by varchar(100) not null references users(id) on delete cascade,

   is_archived boolean not null default false,
   is_locked boolean not null default false,

   created_at timestamp not null default now(),
   updated_at timestamp not null default now(),
);

create table pinned_messages(
   id uuid primary key default uuid_generate_v4(),
   message_id uuid not null references messages(id) on delete cascade,
   channel_id uuid not null references channels(id) on delete cascade,
   pinned_by varchar(100) not null references users(id) on delete cascade,
   created_at timestamp default now(),
   updated_at timestamp default now()
);

create index concurrently idx_pin_msg_channel_id on pinned_messages(channel_id);
create index concurrently idx_pin_msg_pinned_by on pinned_messages(pinned_by);

create table roles(
   id uuid primary key default uuid_generate_v4(),
   name varchar(25) not null,
   server_id uuid not null references servers(id) on delete cascade,
   color varchar(25) not null,
   created_by varchar(100) not null references users(id) on delete cascade,
   icon text,
   icon_id varchar(100),
   hoist boolean default false,
   mentionable boolean default false,
   created_at timestamp default now(),
   updated_at timestamp default now()
);


create table permissions(
   id uuid primary key default uuid_generate_v4(),
   role_id uuid not null references roles(id) on delete cascade,
   list varchar(50)[],
   created_at timestamp default now(),
   updated_at timestamp default now()
);

CREATE TABLE server_profile (
   id uuid primary key default uuid_generate_v4(),
   server_id uuid not null references servers(id) on delete cascade,
   user_id varchar(100) not null references users(id) on delete cascade,
   username varchar(100) NOT NULL,
   avatar text DEFAULT '' NOT NULL,
   avatar_asset_id varchar(100),
   bio text,
   created_at timestamp default now(),
   updated_at timestamp default now()
);

create table invitations(
   id uuid primary key default uuid_generate_v4(),
   code varchar(25) not null,
   server_id uuid not null references servers(id) on delete cascade,
   max_users int default 0,
   created_by varchar(100) not null references users(id) on delete cascade,
   uses int default 0,
   created_at timestamp default now(),
   updated_at timestamp default now()
);

create index concurrently idx_invitations_code on invitations(code);
create index concurrently idx_invitations_server_id on invitations(server_id);

--  ALTER TABLE server_profile ADD COLUMN member_id uuid;
--
--  UPDATE server_profile sp
--  SET member_id = m.id::uuid
--  FROM members m
--  WHERE m.server_id::uuid = sp.server_id AND m.user_id = sp.user_id;
--
--  ALTER TABLE server_profile
--    ALTER COLUMN member_id SET NOT NULL,
--    ADD CONSTRAINT server_profile_member_id_fkey
--      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;


ALTER TABLE category
 ADD CONSTRAINT category_server_id_fkey
 FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE;

create table user_roles(
   id uuid primary key default uuid_generate_v4(),
   "user_id" varchar(100) not null references users(id) on delete cascade,
   server_id uuid not null references servers(id) on delete cascade,
   role_id uuid not null references roles(id) on delete cascade,
   assigned_by varchar(100) not null references users(id) on delete cascade,
   created_at timestamp default now(),
   updated_at timestamp default now()
);


create table friends(
   id uuid primary key default uuid_generate_v4(),
   requester_id varchar(100) not null references users(id) on delete cascade,
   addressee_id  varchar(100) not null references users(id) on delete cascade,
   status        VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
   created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id),
   CONSTRAINT unique_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friends_requester ON friends(requester_id, status);
CREATE INDEX idx_friends_addressee ON friends(addressee_id, status);
