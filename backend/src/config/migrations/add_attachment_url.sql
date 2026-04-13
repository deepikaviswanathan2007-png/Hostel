-- ============================================================
-- Migration: Add attachment_url column to complaints table
-- Run this against your MySQL database to enable file uploads
-- ============================================================

ALTER TABLE complaints
  ADD COLUMN attachment_url VARCHAR(500) DEFAULT NULL
  AFTER admin_note;
