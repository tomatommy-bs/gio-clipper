CREATE TABLE geo_templates (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  parent_template_id TEXT REFERENCES geo_templates(id),
  parent_region_id   TEXT,
  canvas_width       INTEGER NOT NULL DEFAULT 800,
  canvas_height      INTEGER NOT NULL DEFAULT 900
);
