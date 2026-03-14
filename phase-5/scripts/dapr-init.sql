-- Pre-create Dapr state store tables so Dapr skips its own migration
-- (Dapr's migration times out on Neon free tier cold-start)

CREATE TABLE IF NOT EXISTS dapr_metadata (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    updatetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dapr_state (
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    isbinary BOOLEAN NOT NULL,
    etag TEXT NOT NULL,
    expiredate TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    PRIMARY KEY (key)
);

-- Tell Dapr migrations 1 and 2 are already done
INSERT INTO dapr_metadata (key, value, updatetime)
VALUES ('migrations', '2', NOW())
ON CONFLICT (key) DO UPDATE SET value = '2', updatetime = NOW();

SELECT 'Dapr tables ready.' AS status;
