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

Acceptance: importing or generating candidates cannot modify the published catalog; approval cannot publish an excerpt absent from the imported source; rerunning a cached import avoids redundant fetches.

## Milestone 4 — Validate and hand off

- [x] Importer fixture tests for retrieval, caching, normalization, matching, truncation, and approval boundaries.
- [x] Catalog tests for filtering, aliases, ranking, and seed consistency.
- [x] Run instructions and expansion workflow.
- [x] Record final build, route, and browser-check results in `VALIDATION.md`.

## Deliberately outside the initial MVP

A comprehensive HN crawl, LLM extraction, automated metadata resolution, account login, cross-device reading lists, web-based editor, scheduled live updates, semantic search, and an automatic recommendation score. Date-range filtering and richer edition metadata follow broader data coverage. Topic tags currently include AI, AI safety, mathematics, software, and programming languages; the seed does not pretend to contain systems or database books.

## Next iteration

1. Allow `hn.algolia.com` and `hacker-news.firebaseio.com` in the execution environment, then validate the importer against a live thread with `--refresh`.
2. Add 20–50 reviewed source threads spanning software, systems, databases, security, and mathematics.
3. Add an editorial web UI and a durable review-event log if CLI review becomes a bottleneck.
4. Add Open Library work/edition resolution with provenance and manual conflict handling.
5. Move raw items, books, mentions, and review decisions into Postgres; keep source ingestion as a separate scheduled job.
6. Add source-refresh reconciliation for edits/deletions before unattended operation. The current manual workflow requires editors to refresh and remove obsolete evidence explicitly.

## Current environment constraint

HN and Algolia API hosts are absent from the environment’s enforced network allowlist. The seed comments were verified through the web research tool. Fixture tests validate importer behavior; a live import is not claimed. No unrelated configured API credential is used.
