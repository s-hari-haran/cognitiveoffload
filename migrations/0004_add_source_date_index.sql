-- Add source_date index for date filtering performance
-- This migration adds an index to improve date-based queries

-- Index for source_date filtering (crucial for Today feature)
CREATE INDEX IF NOT EXISTS work_items_source_date_idx ON work_items(user_id, source_date);

-- Composite index for user_id + source_date + classification (for Today + classification filtering)
CREATE INDEX IF NOT EXISTS work_items_user_source_date_classification_idx ON work_items(user_id, source_date, classification);

-- Add comment to track migration
COMMENT ON INDEX work_items_source_date_idx IS 'Performance index for date filtering (Today feature)';
COMMENT ON INDEX work_items_user_source_date_classification_idx IS 'Performance index for date + classification filtering'; 