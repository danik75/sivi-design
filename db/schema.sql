-- db/schema.sql
-- Schema for Login PRD
-- Creates pgcrypto extension and users table

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
