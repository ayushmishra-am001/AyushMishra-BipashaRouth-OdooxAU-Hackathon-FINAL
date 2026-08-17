-- Migration: Add email verification and password reset columns to users table
-- This script adds the necessary columns for email verification and password reset functionality

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);
