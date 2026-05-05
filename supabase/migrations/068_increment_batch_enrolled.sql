-- Atomic increment for staffing_batches.total_enrolled
-- Avoids race condition from read-then-write pattern

CREATE OR REPLACE FUNCTION increment_batch_enrolled(p_batch_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE staffing_batches
  SET total_enrolled = total_enrolled + 1,
      updated_at = NOW()
  WHERE id = p_batch_id;
END;
$$ LANGUAGE plpgsql;
