-- Add appointment_resource field to tables
-- This field is optional and can be used for resource booking/scheduling

ALTER TABLE tables ADD COLUMN IF NOT EXISTS appointment_resource TEXT;

-- Add comment to document the field
COMMENT ON COLUMN tables.appointment_resource IS 'Optional field for appointment/resource booking integration';

