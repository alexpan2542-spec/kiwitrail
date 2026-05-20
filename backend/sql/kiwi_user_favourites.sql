CREATE TABLE IF NOT EXISTS kiwi_user_favourites (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT kiwi_user_favourites_unique_user_item
        UNIQUE (user_email, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_kiwi_user_favourites_user_email
    ON kiwi_user_favourites (user_email);

CREATE INDEX IF NOT EXISTS idx_kiwi_user_favourites_item
    ON kiwi_user_favourites (item_type, item_id);