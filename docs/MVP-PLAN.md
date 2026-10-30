# Initial MVP plan

## Objective

Validate whether readers find technical books more easily when the original HN recommendation and its qualifications are visible alongside the catalog.

## Decisions

- **App:** Next.js App Router, React, TypeScript.
- **Styling:** Tailwind CSS v4 plus semantic custom CSS; system fonts and original typographic cover treatments, with no image-service dependency.
- **Published data:** Typed, checked-in JSON. A rebuild publishes editorial changes.
- **Ingestion:** Python 3 standard library; Algolia discovery and official HN item retrieval.
- **Review:** Explicit CLI approval with source-quote validation. Candidate matches are never auto-published.
- **Bookmarks:** localStorage, no authentication or cross-device sync.
- **Testing:** TypeScript behavioral tests, Python fixture tests, production build, HTTP route checks. Browser interaction checks when a supported browser is available.
- **Repository:** `/workspace/hn-books`, separate from the unrelated existing project.

## Milestone 1 — Document the approach

- [x] Preserve product/design, API vs scraping options, extraction, identity, ranking, schema, tooling, and future expansion in `PRODUCT-AND-ARCHITECTURE.md`.
- [x] Define an honest initial dataset and explicit non-goals.

## Milestone 2 — Ship the catalog experience

- [x] Responsive browse view with text search, alias matching, topic filters, audience filter, and sort controls.
- [x] Book routes with metadata, recommendation excerpts, source dates, exact HN comment links, and parent-context links.
- [x] Caveats separated from verbatim evidence.
- [x] Local reading list, persistence, empty states, and storage-error handling.
- [x] About/methodology page, metadata, favicon, and missing-book page.

Acceptance: searches for “AIMA” and “Sutton Barto” find the canonical works; combined filters intersect correctly; discussion counts deduplicate thread IDs; users can trace every displayed recommendation to a comment.

## Milestone 3 — Seed evidence and implement ingestion

- [x] Six work-level records grounded in the user-provided AI discussion.
- [x] Algolia story discovery with optional date windows and explicit coverage/truncation reporting.
- [x] Cached, resumable official-API thread traversal, including parent context and deleted-item state.
- [x] Known-title/alias candidate matching into an unpublished review queue.
- [x] Manual approval requiring canonical book, exact quote, context, thread context, and stance.
- [x] Duplicate, detached-item, deleted-item, and invented-quote rejection.
- [x] Complete live refresh of seed thread `13900153`: 95 items, connected ancestry, 32 unpublished candidates, and all six published excerpts verified against available source comments. Cached traversal reproduced the imported items without network requests.

Acceptance: importing or generating candidates cannot modify the published catalog; approval cannot publish an excerpt absent from the imported source; rerunning a cached import avoids redundant fetches.

## Milestone 4 — Validate and hand off

- [x] Importer fixture tests for retrieval, caching, normalization, matching, truncation, and approval boundaries.
- [x] Catalog tests for filtering, aliases, ranking, and seed consistency.
- [x] Run instructions and expansion workflow.
- [x] Record final build, route, and browser-check results in `VALIDATION.md`.

## Deliberately outside the initial MVP

A comprehensive HN crawl, LLM extraction, automated metadata resolution, account login, cross-device reading lists, web-based editor, scheduled live updates, semantic search, and an automatic recommendation score. Date-range filtering and richer edition metadata follow broader data coverage. Topic tags currently include AI, AI safety, mathematics, software, and programming languages; the seed does not pretend to contain systems or database books.

## Next iteration

1. Completed seed candidate review: 16 new recommendations approved, 5 candidate pairs already included, and 11 excluded. See `SEED-REVIEW.md` for every decision. The catalog now contains 22 reviewed recommendations across the same six works and one discussion.
2. Add 20–50 reviewed source threads spanning software, systems, databases, security, and mathematics.
3. Add an editorial web UI and a durable review-event log if CLI review becomes a bottleneck.
4. Add Open Library work/edition resolution with provenance and manual conflict handling.
5. Move raw items, books, mentions, and review decisions into Postgres; keep source ingestion as a separate scheduled job.
6. Add source-refresh reconciliation for edits/deletions before unattended operation. The current manual workflow requires editors to refresh and remove obsolete evidence explicitly.

## Current environment status

As of 30 October 2026, `hn.algolia.com` and `hacker-news.firebaseio.com` are included in the environment’s enforced network allowlist. The network configuration prerequisite is complete. Continue using the configured HTTPS proxy and TLS verification; neither public API requires an API key.

Onboarding verified an Algolia search and retrieval of HN story item `13900153` through the importer’s fetch helper. A subsequent complete `--refresh` import retrieved 95 items and generated 32 unpublished candidates. Tree closure, ancestry, cached resumption without network requests, and all six published quotes and source-comment availability were verified. The seven importer fixture tests also passed. The published catalog remains unchanged; candidate matches still require editorial review.

## Live discovery expansion

- [x] Search HN comments beyond the curated catalog by title, author, or topic.
- [x] Preserve original source and context links; label every result as an unreviewed mention.
- [x] Relevance/recent ordering, bounded pagination, loading, empty, and failure states.
- [x] Server-side public API integration with validation, timeout, and caching, deployable on Vercel.
- [ ] Resolve arbitrary mentions into canonical book records and classify stance before editorial review. Live search currently returns comments, not an automatically expanded book catalog.

## Local catalog expansion

- [x] Store 30 canonical books and 46 reviewed excerpts from two source discussions in `data/catalog.json`.
- [x] Retain the full 344-item official programming-thread snapshot and a 24-book reviewed import manifest.
- [x] Repeatable, atomic batch merge with duplicate prevention, conflict checks, and exact-quote/source validation.
- [x] Dynamic catalog counts, coverage copy, and expanded topic browsing.

The new programming collection covers software, algorithms, databases, systems, operations, security, and game development. This remains a bounded reviewed collection rather than an exhaustive HN index.

## Bulk local collection

- [x] Harvest 1,010 checksum-valid ISBN edition candidates from HN API results and retain 1,272 source mentions locally.
- [x] Reusable cached, resumable importer with ISBN normalization and duplicate prevention.
- [x] Searchable `/imported` page with server-side pagination and direct evidence links.
- [x] Preserve unreviewed status and identify unresolved metadata instead of inventing titles or recommendation stance.
- [ ] Resolve remaining metadata, group editions into canonical works, check technical relevance, and review stance before promotion into the curated catalog.
