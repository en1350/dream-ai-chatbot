ALTER TABLE t_p20031221_dream_ai_chatbot.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE t_p20031221_dream_ai_chatbot.users ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR(64);
ALTER TABLE t_p20031221_dream_ai_chatbot.users ADD COLUMN IF NOT EXISTS email_verify_sent_at TIMESTAMP;
UPDATE t_p20031221_dream_ai_chatbot.users SET email_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_email_verify_token ON t_p20031221_dream_ai_chatbot.users (email_verify_token);