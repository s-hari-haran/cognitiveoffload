-- Migration: Add sourceDate column to work_items table
-- This stores the actual email/message date, separate from createdAt (processing date)

ALTER TABLE work_items ADD COLUMN source_date TIMESTAMP; 