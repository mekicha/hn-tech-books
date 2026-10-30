# HN Books: product, design, and data architecture

## Goal

A searchable catalog of technical books recommended on Hacker News, grouped by topic, with the original comments and enough surrounding context to understand each recommendation. The differentiator is trustworthy evidence: why a book was recommended, to whom, when, and with what qualifications.

Reference examples:

- Existing catalog: https://hnbooks.pieterma.es/list/
- Initial source discussion: https://news.ycombinator.com/item?id=13900153
- Official API documentation: https://github.com/HackerNews/API
- Search API: https://hn.algolia.com/api

The existing catalog is useful for inspiration and discovery. Its full list could not be fetched by the research tool because the response exceeded its size limit. Its implementation and data-reuse permissions have not been audited. Do not copy its dataset without checking reuse terms and recovering source evidence.

## Product design

### Browse

Search by title, author, alias, or topic. Each result should show title, authors, topic tags, a short recommendation excerpt, and the number of distinct recommending discussions. Give users a compact, readable catalog with small covers, restrained HN-inspired orange accents, and strong typography. Make excerpts prominent; cover art is secondary.

### Book detail

Show the canonical work, publication year, authors, editorial description, audience, and purpose. Under “What HN readers said,” show dated source excerpts, commenter names, original comment links, thread titles, and links to the surrounding conversation. Label editorial summaries separately from quotations. Surface caveats and disagreement rather than presenting HN as a single consensus.

Historical context is essential. A 2017 AI recommendation is not automatically current advice. Work-level metadata should not imply that an older comment recommends a newer edition.

### Taxonomy

Keep these dimensions independent:

| Dimension | Examples |
| --- | --- |
| Topic | AI, software, systems, security, mathematics, databases, programming languages |
| Audience | Beginner, intermediate, advanced |
| Purpose | Practical guide, textbook, reference, conceptual introduction |
| Date | All time, recent recommendations |

Books can have multiple topic tags. Reading level is an editorial judgment, not an HN-provided fact. Avoid a long, uncontrolled list of nearly synonymous tags. Start small and add tags as the collection broadens.

### Later product additions

Date-range filtering, richer edition data, correction submissions, saved lists across devices, reading paths, and personalized suggestions can follow evidence that users need them. The MVP uses browser-local bookmarks and no accounts.

## Collection approaches

| Approach | Best use | Limitation |
| --- | --- | --- |
| Algolia HN search | Discover threads and title/alias mentions | Pagination and search coverage must be checked |
| Official HN API | Retrieve canonical source items and parent/child relationships; refresh changed items | No full-text search; tree traversal requires individual fetches |
| HN HTML scraping | Exceptional fallback | Fragile, usually unnecessary |
| Existing catalogs | Seed candidate books and threads | Reuse terms, provenance, and original source verification matter |

Use Algolia for discovery and the official API for retrieval and refresh. Do not build a scraper when the APIs expose the required data.

Example discovery:

```text
https://hn.algolia.com/api/v1/search?query=books&tags=story
```

Example thread retrieval:

```text
https://hacker-news.firebaseio.com/v0/item/13900153.json
```

Traverse `kids` recursively or iteratively. Preserve comments that contain no titles: they may be essential ancestors for a recommendation. Save `parent`, root thread, author, timestamp, text, and item state. Direct source links use:

```text
https://news.ycombinator.com/item?id=COMMENT_ID
```

Context links can append `&context=3`.

### Discovery strategy

1. Start with hand-picked book discussions across a few technical topics.
2. Search phrases such as “best books,” “books on databases,” and “recommend programming books.”
3. Once canonical books exist, search their full titles and aliases across HN to find recommendations outside dedicated book threads.
4. Partition historical searches by date windows and check truncation; do not assume one query yields all matches.
5. Cache source items, throttle requests, retry transient failures, and checkpoint work for resumption.
6. Refresh before review, and periodically refresh published source items so edits and deletions can be handled.

The official API documentation currently says there is no rate limit, but use bounded concurrency and courteous request spacing anyway. Do not treat that statement as a permanent operational guarantee.

## Extraction and identity resolution

```text
Discover threads → Fetch source trees → Find candidate book mentions
→ Resolve canonical books → Classify recommendation stance
→ Review evidence → Publish
```

Rules can detect known titles, aliases, ISBNs, publisher links, and book URLs. LLMs can help discover informal references and resolve context-dependent endorsements. Neither a regex match nor an LLM guess should automatically become a recommendation.

Suggested future LLM extraction shape:

```json
{
  "title_as_written": "AIMA",
  "author_as_written": null,
  "stance": "recommendation",
  "evidence_quote": "exact text from the source comment",
  "context_comment_ids": [123],
  "topic_tags": ["ai"],
  "needs_review": true
}
```

Validate that each quote is present in the cited comment after deterministic HTML-to-text normalization. Give the model parent context, constrain it to known IDs, and treat comment content as untrusted data. It must not follow instructions embedded in comments. Do not ask the model to invent a reason when the source only names a book.

Classify recommendation, qualified recommendation, criticism, and neutral mention separately. “I wouldn’t recommend this” must not improve a book’s rank. Preserve qualifications and disagreements with their own evidence when expanding the model.

Open Library is a practical first metadata source: https://openlibrary.org/developers/api. Google Books is an optional fallback. Resolve “AIMA” and other aliases to a canonical work; preserve edition-level identifiers where the source actually identifies an edition. Ambiguous titles and author mismatches go to review.

## Data model

| Entity | Main fields |
| --- | --- |
| Books | ID/slug, canonical title, authors, aliases, description |
| Editions | Book ID, edition label, year, ISBNs, metadata source |
| HN items | ID, author, timestamp, parent, root thread, text, deleted/dead state, fetched time |
| Mentions | Book ID, comment ID, exact evidence, stance, context, confidence, review state |
| Tags | Controlled labels and book/tag joins |
| Review events | Reviewer, time, decision, source version, corrections |

One book can have many recommendations; one comment can recommend many books. Enforce uniqueness on book/comment pairs. Keep source snapshots separate from editorial interpretation. In the initial implementation, the published subset lives in `data/catalog.json`, while raw imports and review candidates live in ignored `work/` files.

## Ranking and search

Count distinct recommending discussions and, later, distinct recommenders. Ten comments in one thread should not outweigh ten independent discussions by default. Keep an explicit recent-recommendations sort rather than disguising recency as popularity.

The official API does not expose individual comment scores. Do not invent “most-upvoted recommendations.” Story scores describe the thread and cannot stand in for comment endorsement. The MVP sorts alphabetically, by distinct discussions, or by latest recommendation date. With only one seed thread, discussion counts intentionally tie.

Start with ordinary text search. Add semantic retrieval only when actual queries require it. Embeddings are not necessary to browse a small catalog accurately.

## Stack choices

| Route | Stack | When |
| --- | --- | --- |
| Small curated site | Python → JSON → Astro | Minimal hosting and editorial updates |
| Growing application | Next.js, TypeScript, Postgres/Supabase, Python worker | Ongoing imports, accounts, filters, review UI |
| Historical index | Object storage, queued workers, Postgres, dedicated search | Large-scale coverage and recurring enrichment |

Chosen MVP: Next.js App Router + React + TypeScript, Tailwind CSS, checked-in JSON, Python standard-library ingestion, and localStorage bookmarks. No API keys or database credentials are required to run the app. Ingestion runs independently of page requests. Move to Postgres/Supabase when updates become frequent or a shared review queue/accounts are needed. Add a job queue and metadata enrichment later.

## MVP validation and expansion

Start with a small, manually reviewed catalog and test the full browse → book → original comment journey. Measure identity resolution and stance classification separately. Expand toward 20–50 threads across multiple technical topics after the workflow is reliable. Track rejected matches, duplicate resolution, source deletion handling, and the amount of editorial effort per accepted recommendation.

The useful internal tool is an evidence review queue, not an opaque popularity score. The initial CLI implements this review boundary; a browser-based editorial UI is a later step.
