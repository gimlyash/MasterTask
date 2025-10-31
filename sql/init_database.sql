CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    preferences JSONB
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_category_name_per_user UNIQUE (user_id, name)
);

CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
    deadline TIMESTAMP,
    is_repeating BOOLEAN DEFAULT FALSE,
    repeat_interval VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('active', 'in_progress', 'completed', 'overdue')),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_tags (
    task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('overdue', 'reminder')),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE analytics_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
    action VARCHAR(20) CHECK (action IN ('created', 'completed', 'updated')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

    CREATE INDEX idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX idx_tasks_deadline ON tasks(deadline);
    CREATE INDEX idx_tasks_status ON tasks(status);

CREATE OR REPLACE FUNCTION update_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Новая логика
    IF NEW.deadline < CURRENT_TIMESTAMP 
       AND NEW.status IN ('active', 'in_progress') THEN
        NEW.status := 'overdue';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_overdue
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_overdue_status();