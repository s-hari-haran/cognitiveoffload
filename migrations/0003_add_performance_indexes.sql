-- Add performance indexes for work_items table
-- This migration adds indexes to improve query performance

-- Index for filtering by user_id (most common query)
CREATE INDEX IF NOT EXISTS work_items_user_id_idx ON work_items(user_id);

-- Composite index for user_id + urgency_score (for sorting)
CREATE INDEX IF NOT EXISTS work_items_user_urgency_idx ON work_items(user_id, urgency_score DESC);

-- Composite index for user_id + created_at (for sorting)
CREATE INDEX IF NOT EXISTS work_items_user_created_idx ON work_items(user_id, created_at DESC);

-- Composite index for source lookup (user_id + source_type + source_id)
CREATE INDEX IF NOT EXISTS work_items_source_id_idx ON work_items(user_id, source_type, source_id);

-- Index for classification filtering
CREATE INDEX IF NOT EXISTS work_items_classification_idx ON work_items(user_id, classification);

-- Index for completed status filtering
CREATE INDEX IF NOT EXISTS work_items_completed_idx ON work_items(user_id, is_completed);

-- Add comment to track migration
COMMENT ON INDEX work_items_user_id_idx IS 'Performance index for user filtering';
COMMENT ON INDEX work_items_user_urgency_idx IS 'Performance index for urgency-based sorting';
COMMENT ON INDEX work_items_user_created_idx IS 'Performance index for date-based sorting';
COMMENT ON INDEX work_items_source_id_idx IS 'Performance index for source deduplication';
COMMENT ON INDEX work_items_classification_idx IS 'Performance index for classification filtering';
COMMENT ON INDEX work_items_completed_idx IS 'Performance index for completed status filtering'; 