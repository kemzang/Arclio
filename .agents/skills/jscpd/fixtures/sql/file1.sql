-- Common SQL utility stored procedures

CREATE OR REPLACE FUNCTION validate_input(p_value VARCHAR(255))
RETURNS VARCHAR(255) AS $$
BEGIN
    IF p_value IS NULL OR TRIM(p_value) = '' THEN
        RAISE EXCEPTION 'Input cannot be empty';
    END IF;
    IF LENGTH(p_value) > 255 THEN
        RAISE EXCEPTION 'Input exceeds maximum length';
    END IF;
    RETURN TRIM(p_value);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_paginated_results(
    p_page      INT,
    p_page_size INT,
    p_sort_col  VARCHAR DEFAULT 'id',
    p_sort_dir  VARCHAR DEFAULT 'ASC'
)
RETURNS TABLE (offset_val INT, limit_val INT) AS $$
BEGIN
    RETURN QUERY SELECT
        ((p_page - 1) * p_page_size)::INT AS offset_val,
        p_page_size::INT                  AS limit_val;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW active_user_summary AS
SELECT
    u.id,
    u.name,
    u.email,
    u.created_at,
    COUNT(o.id) AS order_count,
    SUM(o.total) AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.active = TRUE
GROUP BY u.id, u.name, u.email, u.created_at;

-- File-specific: users table
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    active     BOOLEAN DEFAULT TRUE
);
