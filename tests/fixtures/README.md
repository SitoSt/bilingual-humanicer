# Test Fixtures

Text samples for testing the humanizer's AI detection capabilities.

## Index

All fixture metadata (paths, languages, topics, styles, expected scores, status) is in [`index.yaml`](./index.yaml).

## Naming convention

`{topic-slug}-{lang}.txt` — e.g. `airfryer-opinion-es.txt`, `remote-work-en.txt`

## Adding a new fixture

1. Place the `.txt` file in `{category}/{model}/{lang}/`
2. Add an entry to `index.yaml` with all fields filled
3. Add the corresponding test case in `tests/suite.test.js`
4. Minimum 80 words per sample for reliable analysis
