CREATE TABLE geo_regions (
  id          TEXT NOT NULL,
  template_id TEXT NOT NULL REFERENCES geo_templates(id),
  name        TEXT NOT NULL,
  name_en     TEXT NOT NULL DEFAULT '',
  tag_id      TEXT NOT NULL REFERENCES geo_tags(id),
  path        TEXT NOT NULL,
  bbox        JSONB NOT NULL,
  geo_offset  JSONB NOT NULL DEFAULT '{"dx":0,"dy":0}',

  PRIMARY KEY (id, template_id)
);

CREATE INDEX geo_regions_template_id_idx ON geo_regions (template_id);
