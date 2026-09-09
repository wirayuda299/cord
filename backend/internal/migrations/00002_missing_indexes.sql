-- +goose Up
-- threads.message_id has an FK (threads_message_id_fkey) but no index. It's
-- looked up via a correlated subquery on every message-listing query
-- (channel view, thread view, single-message fetch) — a hot path.
CREATE INDEX idx_threads_message_id ON threads(message_id);

-- channels: server_id alone is already indexed, but channels-server.go
-- filters by server_id then ORDER BY name — a composite avoids the extra
-- sort step (categories already has the equivalent unique_category_name_per_server).
CREATE INDEX idx_channels_server_id_name ON channels(server_id, name);

-- audit_logs / bans: both queried as "WHERE server_id = $1 ORDER BY <ts> DESC",
-- but only server_id is indexed today, so the ORDER BY needs its own sort.
CREATE INDEX idx_audit_logs_server_id_created_at ON audit_logs(server_id, created_at DESC);
CREATE INDEX idx_bans_server_id_banned_at ON bans(server_id, banned_at DESC);

-- servers.private is filtered directly in browse.go ("WHERE private = false
-- AND ..."). A plain btree on a boolean is low-selectivity and not worth it,
-- but a partial index matching the actual predicate serves this query well.
CREATE INDEX idx_servers_id_where_public ON servers(id) WHERE private = false;

-- +goose Down
DROP INDEX IF EXISTS idx_threads_message_id;
DROP INDEX IF EXISTS idx_channels_server_id_name;
DROP INDEX IF EXISTS idx_audit_logs_server_id_created_at;
DROP INDEX IF EXISTS idx_bans_server_id_banned_at;
DROP INDEX IF EXISTS idx_servers_id_where_public;
