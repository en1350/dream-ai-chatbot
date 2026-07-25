CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP DEFAULT (now() + INTERVAL '1 hour'),
    used_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);