CREATE TABLE geo_tags (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

INSERT INTO geo_tags (id, label) VALUES
  ('prefecture',   '都道府県'),
  ('municipality', '市区町村');
