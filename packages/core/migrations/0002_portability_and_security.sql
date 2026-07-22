ALTER TABLE user ADD COLUMN role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE collection_fields ADD COLUMN config TEXT;
ALTER TABLE media ADD COLUMN alt_text TEXT;
ALTER TABLE media ADD COLUMN caption TEXT;
ALTER TABLE media ADD COLUMN focal_x INTEGER;
ALTER TABLE media ADD COLUMN focal_y INTEGER;
ALTER TABLE media ADD COLUMN variants TEXT;
ALTER TABLE comments ADD COLUMN user_id TEXT REFERENCES user(id) ON DELETE SET NULL;
ALTER TABLE comments ADD COLUMN rate_limit_key TEXT;
ALTER TABLE comments ADD COLUMN spam_score INTEGER DEFAULT 0;
ALTER TABLE tracking_scripts ADD COLUMN trusted INTEGER NOT NULL DEFAULT 0;

CREATE TABLE collection_redirects (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
	old_slug TEXT NOT NULL,
	new_slug TEXT NOT NULL,
	created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX collection_redirects_old_slug_idx
	ON collection_redirects(old_slug);

CREATE TABLE entry_redirects (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
	collection_slug TEXT NOT NULL,
	old_slug TEXT NOT NULL,
	new_slug TEXT NOT NULL,
	created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX entry_redirects_lookup_idx
	ON entry_redirects(collection_slug, old_slug);

CREATE INDEX comments_public_idx
	ON comments(entry_id, status, created_at);

