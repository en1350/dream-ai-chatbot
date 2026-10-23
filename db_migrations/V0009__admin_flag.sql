ALTER TABLE t_p20031221_dream_ai_chatbot.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE t_p20031221_dream_ai_chatbot.users SET is_admin = TRUE WHERE id = 1;