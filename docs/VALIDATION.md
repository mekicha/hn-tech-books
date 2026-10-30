# Validation report

Date: 30 October 2026.

## Passed

| Check | Result |
| --- | --- |
| `npm test` | 4 catalog tests passed |
| `npm run test:import` | 7 Python importer tests passed |
| `npm run typecheck` | Passed |
| `npm run build` | Next.js production build succeeded; browse, about, and six book pages prerendered |
| `npm run test:e2e` | 10 Chromium tests passed across desktop and mobile profiles |
| Visual inspection | Desktop 1440px and mobile 390px full-page screenshots reviewed |

Browser checks ran against the production server. They cover alias search, combined filters, no-results recovery, latest-recommendation sorting, reading-list persistence across reloads, removal from a book detail page, exact source URLs, parent-context URLs, dates, editorial labeling, external metadata lookup, viewport overflow, methodology navigation, 404 status and content, and blocked browser storage. The catalog search test also asserts that no client-side page errors occurred during that flow.

Importer fixtures cover HTML normalization, alias boundaries, complete tree traversal, cached resumption, explicit refresh, preservation of parent context, deleted-item exclusion, unreviewed negative mentions, exact quote validation, duplicate rejection, thread ancestry, incomplete imports, stance gates, date-window discovery, truncation reporting, and missing-item/size-limit failures.

## Not verified or implemented

- Live HN/Algolia API fetching: the enforced environment network policy does not allow `hacker-news.firebaseio.com` or `hn.algolia.com`. Fixture tests are not evidence of a successful live import.
- Historical completeness: the seed contains six reviewed books from one 2017 AI discussion. Source excerpts and comment IDs were checked through the web research tool, not through the Python importer in this environment.
- Automated extraction, LLM classification, and metadata enrichment are future work. The current importer matches known titles/aliases and requires manual review.
- Source edits/deletions require a refresh and manual reconciliation; there is no unattended sync.
- No external hosting, domain, shared database, accounts, or cross-device bookmark sync is configured.
- Browser tests use Chromium with desktop and mobile viewport emulation; actual Safari and Firefox were not tested.

## Reproduce browser tests

Install dependencies with `npm ci`, then run `npx playwright install chromium` if a system Chromium is unavailable. The test configuration automatically uses `/usr/bin/chromium` when present, or accepts `CHROMIUM_PATH`. Run:

```sh
npm run test:e2e
```

A running app on port 3000 is reused outside CI; otherwise the test runner starts the dev server. For production verification, first run `npm run build` and `npm start` in another terminal.

Source imports and test artifacts remain in ignored `work/`. Screenshots in the downloadable deliverables show the validated initial UI.
