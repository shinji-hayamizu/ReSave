-- Update tag color from hex to color name
ALTER TABLE tags ALTER COLUMN color SET DEFAULT 'blue';
ALTER TABLE tags ALTER COLUMN color TYPE VARCHAR(20);

-- Update existing hex colors to color names (if any exist)
UPDATE tags SET color = 'blue' WHERE color = '#6366f1' OR color NOT IN ('blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'yellow', 'gray');
