# The Hacker’s Bookshelf

A working MVP for discovering technical books recommended on Hacker News, with dated excerpts, exact comment links, and editorial context.

## Stack

Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, a checked-in JSON catalog, and a Python 3 standard-library import/review CLI. Bookmarks stay in browser localStorage. No database or API keys are needed to run the app.

## Run

Requires Node.js 22+ and Python 3.10+ for ingestion/tests.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production server:

```sh
npm run build
npm start
```

## Live HN discovery

Use **Search HN** (`/discover`) to search comments across Hacker News by book title, author, or topic, beyond the locally stored catalog. Results include original comment and conversation links, dates, relevance/recent ordering, and pagination (up to 50 pages). Search results are unreviewed mentions, which can include criticism and incidental matches; they are not automatically added to the catalog or reading list. Algolia coverage is not exhaustive, and this does not automatically identify every book in topic discussions.

The `/api/discover` Next.js server route uses the public Algolia API, a 10-second timeout, and five-minute fetch caching. No API key or database is required. On Vercel use the standard Next.js deployment, not static export. In the managed environment, Node 24 needs `NODE_USE_ENV_PROXY=1 npm run dev` (or `NODE_USE_ENV_PROXY=1 npm start` after building) to use the configured HTTPS proxy. Keep TLS verification enabled.

## Included

- Search titles, authors, aliases, topics, and descriptions.
- Filter by overlapping topic tags and reading level.
- Sort alphabetically, by distinct source discussions, or latest recommendation.
- Book pages with verbatim excerpts, original comment and parent-context links, dates, and caveats.
- Browser-local reading list with empty states and storage failure handling.
- 30 locally stored, reviewed books across two HN discussions, spanning software, algorithms, databases, systems, security, and AI. Counts represent this collection, not all of HN.
- Unpublished import/candidate queue and explicit editorial approval.

## Documentation

- [Product, research, design, and architecture](docs/PRODUCT-AND-ARCHITECTURE.md)
- [MVP implementation plan](docs/MVP-PLAN.md)
- [Validation results and limitations](docs/VALIDATION.md)

## Import and review

Run commands from this repository. Live data access requires outbound access to `hn.algolia.com` and `hacker-news.firebaseio.com`. Both domains are enabled in the managed environment, and a complete refreshed seed-thread import has been verified. Continue using its configured network proxy and policy.

### 1. Discover threads

```sh
python3 scripts/hn_import.py discover 'best programming books' \
  --after 2020-01-01 --before 2021-01-01 \
  --output work/discovery.json
```

Check `truncated`. Use narrower date windows if results are truncated or non-exhaustive. This command searches story titles/body, not the entire comment corpus. Future title/alias discovery across comments should use Algolia comment searches and recover each matched root thread.

### 2. Import a complete thread

```sh
python3 scripts/hn_import.py thread 13900153 --output work/ai-thread.json
```

The importer caches each item, spaces network fetches, retries transient errors, and preserves parent context. A failure does not overwrite the completed bundle. Rerun to resume cached work. Before publishing or checking source changes, refresh:

```sh
python3 scripts/hn_import.py thread 13900153 --refresh --output work/ai-thread.json
```

`--max-items` defaults to 10,000 and aborts on overflow rather than silently certifying a partial thread. Raw imports are untrusted source data and must not be rendered as HTML.

### 3. Generate review candidates

```sh
python3 scripts/hn_import.py candidates work/ai-thread.json --output work/candidates.json
```

This matches known canonical titles and aliases from the catalog. It does not discover all possible new books or infer endorsement. Negative and neutral mentions also appear as unreviewed candidates. Inspect the text, parent, and original HN discussion before deciding.

To add a new canonical work, first add its metadata to `data/catalog.json`, following the existing schema: unique slug, title, authors, first-publication year, tags, audience, purpose, editorial description, hex color, aliases, recommendations, and caveat. Newly staged books may have an empty recommendation array during review, but must have reviewed evidence before the app is built. `npm test` checks that boundary.

### 4. Approve a recommendation

This is an example of the command shape. Replace the comment, quote, and editorial context with reviewed evidence; the seeded recommendation already exists and will correctly be rejected as a duplicate.

```sh
python3 scripts/hn_import.py approve work/ai-thread.json \
  --book paradigms-of-ai-programming \
  --comment 13901769 \
  --quote 'PAIP is one of most elegant and timeless books for both programming and old school AI.' \
  --context 'The reply contrasts PAIP’s programming depth with AIMA’s broader coverage.' \
  --thread-context 'The asker wanted practical AI books without much prior knowledge.' \
  --stance recommendation
```

Use `--stance 'qualified recommendation'` where appropriate. Only this command writes to the published catalog. It validates that the comment belongs to the complete source tree, the quote is an exact substring of normalized source text, the item is available, and the book/comment pair is new. Editorial judgment is still required to establish the book identity and positive stance. A command flag cannot prove sentiment.

Review the Git diff, run checks, update the coverage note if the dataset expands, and rebuild. Current public coverage copy is intentionally specific to the seed; change it when adding threads. Source refresh does not automatically remove published evidence: editors must review edits/deletions and update catalog records manually.

## Checks

```sh
npm test
npm run test:import
npm run typecheck
npm run build
npm run test:e2e
```

For browser setup and production-test reproduction, see `docs/VALIDATION.md`.

## Layout

```text
app/                  Browse, book detail, about, and missing-page routes
components/           Catalog controls and shared reading-list state
lib/catalog.ts        Types, filtering, ranking, source/date helpers
data/catalog.json     Reviewed public catalog
scripts/hn_import.py  Discovery, retrieval, matching, approval CLI
tests/                Catalog behavior and importer fixture tests
docs/                 Product write-up, MVP plan, validation report
work/                 Ignored caches, raw threads, and unpublished candidates
```

## Data integrity and privacy

No invented HN comment scores, recommendation counts, or quote text. Original source URLs are preserved. Book publication years refer to the original work; editions are not inferred from later metadata. Reading levels, descriptions, and caveats are editorial. The app includes no tracking, accounts, or third-party font/image requests. External HN and Open Library links open only when followed.

Next production build warnings and dependency notices should be addressed before deployment. This repo is a local MVP; no external hosting or domain has been configured.

## Expand the local catalog

The app reads `data/catalog.json` at build time. It currently contains 30 books and 46 reviewed excerpts. The 24 additional programming works are described in `data/imports/programming-books.json`; the complete official API response bundle (344 items) is retained in `data/sources/programming-thread.json`. Titles/authors are canonical editorial metadata, while quotes, authors of comments, and dates are validated against API items. Publication years describe original works, not the edition discussed.

Reproduce or refresh the programming collection:

```sh
python3 scripts/hn_import.py thread 14486657 --refresh --output work/programming-thread.json
python3 scripts/import_reviewed.py data/imports/programming-books.json work/programming-thread.json
npm test
npm run test:import
npm run build
```

The merge validates all entries before atomically writing the catalog. Repeated runs skip identical book/comment pairs; changed quotes or conflicting identities require reconciliation. To add more works, create another reviewed manifest with the same structure and fetch its complete thread first. A title mention alone does not establish a recommendation. New local books automatically receive pages, search, topic filtering, and reading-list support after rebuild. Commit reviewed manifests and relevant source snapshots alongside catalog changes. No runtime database or write access on Vercel is needed.

## Bulk HN book imports (1,010 ISBN candidates)

Open **Imported books** (`/imported`) to browse and search the locally stored bulk collection. `data/hn-book-candidates.json` currently contains 1,010 distinct checksum-valid ISBN-13 edition candidates and 1,272 source mentions, obtained from 110 Algolia search pages covering 2016–2026. It is stored in the repository and works without a live API call when browsing. The server renders 24 results per page rather than sending the full dataset to the browser.

```sh
python3 scripts/bulk_books.py --target 1000
# Continue expanding using cached search pages and merge new ISBNs:
python3 scripts/bulk_books.py --target 2000
npm run build
```

The importer scans bounded yearly searches for Amazon links in comments with technical terms, verifies ISBN checksums, converts ISBN-10 to ISBN-13, and deduplicates by ISBN and comment ID. Search responses are cached in ignored `work/bulk-search/`; output is saved atomically after every page and can resume after interruption. A run exits unsuccessfully if the requested target cannot be met within its search bounds. Existing imports are preserved. No API credentials or additional dependencies are required.

These are **unreviewed edition candidates**, not 1,010 verified technical works or endorsements. Source URL/anchor labels can be incomplete, and 94 titles remain unresolved (shown by ISBN). Multiple editions can describe the same work; technical-context filtering can include off-topic titles. Mentions retain their original wording, including criticism. The bounded search is not historically exhaustive and does not include books without recognized ISBN links. Search audit counts and limitations are stored in `data/imports/bulk-search-report.json`. Use the reviewed-manifest workflow to promote verified works into `data/catalog.json`; bulk records do not silently become curated recommendations.

The homepage now opens the entire imported collection with pagination and collection totals. **Reviewed books** opens the curated catalog (`/?reviewed=1`); **Reading list** continues to show saved reviewed books (`/?saved=1`). Imported counts describe ISBN editions and should not be added to reviewed counts as if they were disjoint canonical works.
