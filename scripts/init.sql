-- PropScope Database Initialization
-- PostgreSQL 15

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Set timezone
SET timezone = 'Asia/Seoul';

-- Create enum types (Prisma will also create these, but useful for reference)
-- DO $$ BEGIN
--   CREATE TYPE property_type AS ENUM ('villa', 'officetel');
-- EXCEPTION WHEN duplicate_object THEN null;
-- END $$;
