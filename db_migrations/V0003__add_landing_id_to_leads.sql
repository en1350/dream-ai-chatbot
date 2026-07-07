ALTER TABLE leads ADD COLUMN IF NOT EXISTS landing_id integer REFERENCES landings(id);
CREATE INDEX IF NOT EXISTS idx_leads_bot_id ON leads(bot_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
