CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- updated_at helper
-- =========================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================================
-- enums
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_types') THEN
    CREATE TYPE channel_types AS ENUM ('text', 'audio', 'forum', 'dm', 'group_dm');
  END IF;
END $$;


-- =========================================================
-- users
-- =========================================================

CREATE TABLE users (
  id varchar(100) PRIMARY KEY,
  username varchar(50) NOT NULL,
  avatar_url text NOT NULL DEFAULT '',
  avatar_id varchar(100) NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
create extension if not exists pg_trgm;
CREATE EXTENSION
create index username_trgm_idx on users using gin (username gin_trgm_ops);
 set pg_trgm.similarity_threshold = 0.2;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- servers
-- =========================================================

CREATE TABLE servers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(25) NOT NULL,
  logo text NOT NULL DEFAULT '',
  logo_id varchar(100) NOT NULL DEFAULT '',
  banner text NOT NULL DEFAULT '',
  banner_id varchar(100) NOT NULL DEFAULT '',
  banner_colors varchar(20)[] NOT NULL DEFAULT ARRAY['#FFFFFF', '#000000'],
  description text NOT NULL DEFAULT '',
  private boolean NOT NULL DEFAULT false,
  created_by varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_servers_name ON servers(name);
CREATE INDEX idx_servers_created_by ON servers(created_by);

CREATE TRIGGER trg_servers_updated_at
BEFORE UPDATE ON servers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- server members
-- =========================================================

CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_server_member UNIQUE (user_id, server_id)
);

CREATE INDEX idx_members_server_id ON members(server_id);
CREATE INDEX idx_members_user_id ON members(user_id);


-- =========================================================
-- server profile
-- =========================================================

CREATE TABLE server_profile (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  username varchar(100) NOT NULL,
  avatar text NOT NULL DEFAULT '',
  avatar_asset_id varchar(100) NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_server_profile_user UNIQUE (server_id, user_id),
  CONSTRAINT unique_server_profile_member UNIQUE (member_id)
);

CREATE INDEX idx_server_profile_server_id ON server_profile(server_id);
CREATE INDEX idx_server_profile_user_id ON server_profile(user_id);

CREATE TRIGGER trg_server_profile_updated_at
BEFORE UPDATE ON server_profile
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- categories
-- =========================================================

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(25) NOT NULL,
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  created_by varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_category_name_per_server UNIQUE (server_id, name)
);

CREATE INDEX idx_categories_server_id ON categories(server_id);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- channels
-- =========================================================

CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- server channel:
  --   server_id not null
  -- DM/group DM:
  --   server_id null
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE,

  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,

  name varchar(25),
  topic text NOT NULL DEFAULT '',
  channel_type channel_types NOT NULL DEFAULT 'text',

  -- stable unique key for 1:1 DM
  -- example: userA:userB, sorted alphabetically in app layer
  dm_key text,

  created_by varchar(100) REFERENCES users(id) ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT channels_scope_check CHECK (
    (
      server_id IS NOT NULL
      AND channel_type IN ('text', 'audio', 'forum')
      AND name IS NOT NULL
      AND dm_key IS NULL
    )
    OR
    (
      server_id IS NULL
      AND channel_type = 'dm'
      AND name IS NULL
      AND dm_key IS NOT NULL
    )
    OR
    (
      server_id IS NULL
      AND channel_type = 'group_dm'
      AND dm_key IS NULL
    )
  )
);

CREATE INDEX idx_channels_server_id ON channels(server_id);
CREATE INDEX idx_channels_category_id ON channels(category_id);
CREATE INDEX idx_channels_created_by ON channels(created_by);
CREATE INDEX idx_channels_type ON channels(channel_type);

CREATE UNIQUE INDEX channels_dm_key_unique
ON channels(dm_key)
WHERE channel_type = 'dm' AND dm_key IS NOT NULL;

CREATE TRIGGER trg_channels_updated_at
BEFORE UPDATE ON channels
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- channel members for DM / group DM
-- =========================================================

CREATE TABLE channel_members (
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT NOW(),

  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX idx_channel_members_channel_id ON channel_members(channel_id);


-- =========================================================
-- threads
-- =========================================================

CREATE TABLE threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  name varchar(255),
  created_by varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id uuid not null references messages(id) on delete cascade,
  is_archived boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threads_channel_id ON threads(channel_id);
CREATE INDEX idx_threads_created_by ON threads(created_by);

CREATE TRIGGER trg_threads_updated_at
BEFORE UPDATE ON threads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- messages
-- =========================================================

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  content text NOT NULL DEFAULT '',

  user_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  image_url text NOT NULL DEFAULT '',
  image_asset_id varchar(100) NOT NULL DEFAULT '',

  -- normal channel message
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,

  -- thread message
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,

  -- reply to another message
  parent_msg_id uuid REFERENCES messages(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT message_location_check CHECK (
    (
      channel_id IS NOT NULL
      AND thread_id IS NULL
    )
    OR
    (
      channel_id IS NULL
      AND thread_id IS NOT NULL
    )
  ),

  CONSTRAINT message_has_content_or_image CHECK (
    content <> ''
    OR image_url <> ''
  )
);

CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_channel_created_at ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_thread_created_at ON messages(thread_id, created_at DESC);
CREATE INDEX idx_messages_parent_msg_id ON messages(parent_msg_id);

-- optional full-text search
CREATE INDEX idx_messages_content_search
ON messages
USING gin (to_tsvector('simple', content));

CREATE TRIGGER trg_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- pinned messages
-- =========================================================

CREATE TABLE pinned_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  pinned_by varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_pinned_message_per_channel UNIQUE (message_id, channel_id)
);

CREATE INDEX idx_pinned_messages_channel_id ON pinned_messages(channel_id);
CREATE INDEX idx_pinned_messages_pinned_by ON pinned_messages(pinned_by);

CREATE TRIGGER trg_pinned_messages_updated_at
BEFORE UPDATE ON pinned_messages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- roles
-- =========================================================

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(25) NOT NULL,
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  color varchar(25) NOT NULL DEFAULT '#FFFFFF',
  created_by varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon text NOT NULL DEFAULT '',
  icon_id varchar(100) NOT NULL DEFAULT '',
  hoist boolean NOT NULL DEFAULT false,
  mentionable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_role_name_per_server UNIQUE (server_id, name)
);

CREATE INDEX idx_roles_server_id ON roles(server_id);

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- permissions
-- =========================================================

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  list varchar(50)[] NOT NULL DEFAULT ARRAY[]::varchar[],
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_permissions_role UNIQUE (role_id)
);

CREATE TRIGGER trg_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- user roles
-- =========================================================

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_role_per_server UNIQUE (user_id, server_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_server_id ON user_roles(server_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

CREATE TRIGGER trg_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- invitations
-- =========================================================

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(25) NOT NULL,
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  max_users int NOT NULL DEFAULT 0,
  uses int NOT NULL DEFAULT 0,
  created_by varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_invitation_code UNIQUE (code),
  CONSTRAINT invitation_uses_check CHECK (uses >= 0),
  CONSTRAINT invitation_max_users_check CHECK (max_users >= 0)
);

CREATE INDEX idx_invitations_server_id ON invitations(server_id);
CREATE INDEX idx_invitations_created_by ON invitations(created_by);

CREATE TRIGGER trg_invitations_updated_at
BEFORE UPDATE ON invitations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- friends
-- =========================================================

CREATE TABLE friends (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  requester_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status varchar(10) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'blocked')),

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id),
  CONSTRAINT unique_friend_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friends_requester_status ON friends(requester_id, status);
CREATE INDEX idx_friends_addressee_status ON friends(addressee_id, status);

CREATE TRIGGER trg_friends_updated_at
BEFORE UPDATE ON friends
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

 CREATE TABLE reactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id uuid NOT NULL REFERENCES messages(id) ON DELETE
  CASCADE,
    user_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE
  CASCADE,
    emoji varchar(10) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_reaction UNIQUE (message_id, user_id,
  emoji)
  );

  CREATE INDEX idx_reactions_message_id ON reactions(message_id);
  CREATE INDEX idx_reactions_user_id ON reactions(user_id);
