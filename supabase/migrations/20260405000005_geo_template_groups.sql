CREATE TABLE geo_template_groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE geo_template_group_members (
  group_id    TEXT NOT NULL REFERENCES geo_template_groups(id),
  template_id TEXT NOT NULL REFERENCES geo_templates(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (group_id, template_id)
);
