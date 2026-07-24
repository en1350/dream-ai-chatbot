-- Кошелёк пользователя и поля тарифа
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_kopecks BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_started_at TIMESTAMP NULL;

-- Таблица транзакций кошелька (пополнения и списания)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount_kopecks BIGINT NOT NULL,
    kind VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description VARCHAR(500) NOT NULL DEFAULT '',
    provider VARCHAR(30) NOT NULL DEFAULT '',
    provider_payment_id VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_provider_payment ON wallet_transactions(provider_payment_id);
