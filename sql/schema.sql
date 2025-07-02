-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table to start fresh
DROP TABLE IF EXISTS tasks CASCADE;

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    importance TEXT CHECK (importance IN ('low', 'medium', 'high')) NOT NULL,
    predicted_effort VARCHAR(256) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    priority_score INTEGER,
    reasoning TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
