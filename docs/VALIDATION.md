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

## Live ingestion validation

On 30 October 2026, with both API domains allowed, `python3 scripts/hn_import.py thread 13900153 --refresh --output work/ai-thread.json` completed with 95 items. Candidate generation produced 32 unpublished matches in `work/candidates.json`. Checks verified that every referenced child was present, every non-root item's parent chain reached the source thread without cycles, and all six published excerpts remained exact substrings of available source comments. A cached traversal reproduced all imported items with a fetch function that fails on any network request. All seven importer fixture tests passed again. The catalog was not modified.

An Algolia search and an individual Firebase item request were also verified during onboarding. This validates the seed import workflow, not historical completeness or the editorial suitability of the generated candidates.

## Seed editorial review

Reviewed all 32 candidates; see `SEED-REVIEW.md` for decisions and rationale. Added 16 recommendations through the approval CLI, retained 5 already-included candidate pairs, and excluded 11 matches. The six-book catalog now contains 22 recommendations from the same discussion, including the existing reinforcement-learning excerpt that alias matching did not rediscover. All 22 exact quotes match available imported comments. All 4 catalog tests, 7 importer tests, the production build, type checking, and 10 desktop/mobile Chromium tests against the production server passed after the additions. The evidence browser test now checks all six PAIP recommendation cards and scopes original source assertions to the existing excerpt.

## Not verified or implemented

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

## Live discovery expansion

The production `/api/discover` endpoint returned 20 comments and 709 reported matches for “Designing Data-Intensive Applications”. Six TypeScript tests, the production build, and type checking passed. Existing catalog browser tests passed on desktop and mobile. Four new discovery browser cases passed after scoping the failure-message assertion to exclude Next.js’s route announcer; they exercise mentions (including criticism), source links, pagination, empty results, and upstream failures with controlled responses. Algolia results are unreviewed comment matches and do not establish canonical book identity or positive sentiment.

## Bulk ISBN import validation

The live Algolia import stored 1,010 unique checksum-valid ISBN-13 candidates with 1,272 distinct book/comment mentions. The import consumed 110 bounded yearly search pages (2016–2026). All records have unreviewed status and source provenance; 94 titles are unresolved. These counts describe editions and mentions, not verified distinct technical works or positive recommendations.

ISBN checksums, ISBN-10 conversion, extraction host restrictions, and criticism preservation passed in the 14-test Python suite. All six TypeScript tests, production build, type checking, and all 18 desktop/mobile browser tests passed. The imported-page checks exercise local search, ISBN lookup, pagination, source links, and mobile overflow while external Algolia browser requests are blocked. Re-running the importer with its already-satisfied target preserved the stored collection without further retrieval. Search audit details are in `data/imports/bulk-search-report.json`.
