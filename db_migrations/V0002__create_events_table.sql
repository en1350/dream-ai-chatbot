CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    text VARCHAR(500) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'Bell',
    color VARCHAR(50) NOT NULL DEFAULT 'text-aqua',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user_created ON events(user_id, created_at DESC);
