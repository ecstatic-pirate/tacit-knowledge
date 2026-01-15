-- Add departure_date column for Expert campaigns
-- This tracks when the expert is leaving/retiring

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS departure_date date;

-- Add comment for documentation
COMMENT ON COLUMN campaigns.departure_date IS 'Expected departure date for expert campaigns (optional)';
