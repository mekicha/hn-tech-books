# Technical-book publication audit

Date: 30 October 2026.

The original HN keyword filter admitted nontechnical books because it searched surrounding comments. That filter is suitable for discovery, not publication. The public shelf now requires an explicit inclusion decision and a cleaned title. No review decision means no publication.

## Dispositions

| Dataset | Included | Excluded | Held for metadata review |
| --- | ---: | ---: | ---: |
| 1,010 imported ISBN editions | 651 | 354 | 5 |
| 30 curated works | 30 | 0 | 0 |

The two datasets overlap; their counts must not be added as unique works. Raw imports remain unchanged for auditability. Per-record reasons, titles, categories, and dates are in `data/reviews/imported-books.json`.

Scope includes computing, programming, software engineering, security, databases, networks, computer history, mathematics, electronics, and directly related engineering/technical texts. General fiction, sales, finance, politics, religion, self-help, health, and unrelated general-interest reading are excluded. The Alchemist, Normal People, SPIN Selling, and The Solution Selling Fieldbook are explicit exclusion regression cases.

Included titles have been editorially normalized and displayed prominently. Ambiguous bibliographic reconstructions and ISBN-only labels remain hidden. Search uses title, category, and ISBN rather than incidental words in a comment. Mentions are not described as endorsements.

## Limits and follow-up

Open Library access now works. All 1,010 ISBNs were looked up: 987 returned a record, including one untitled record, and 23 returned no match. Metadata retrieval by itself never grants publication. All 153 initially held records have lookup outcomes and explicit follow-up decisions: 111 technical editions included, 37 off-topic works excluded, and 5 no-match records remain hidden.

642 published editions have Open Library title metadata; their authors and bibliographic links are displayed when available. The remaining 9 published editions retain source-based editorial review because Open Library returned no match. This distinction is visible per book. The 30 curated works remain included based on their prior source-backed editorial review; they are work-level records and are not all edition-verified through this bulk ISBN lookup.

The five still-held ISBNs are `9780655933304`, `9780992001032`, `9781683928980`, `9781805128724`, and `9783831138937`. They need another bibliographic source or a corrected ISBN before publication. Open Library is a bibliographic source, not proof of technical relevance, edition accuracy, or positive recommendation stance.

The complete metadata snapshot is `data/reviews/isbn-metadata.json`; explicit decisions for the original pending queue are in `data/reviews/metadata-decisions.json`. Retrieval is resumable and applying decisions is idempotent. An untitled API response is tracked as missing-title data rather than used as a display title.

Bulk source comments may be historical, edited, deleted, or critical of the book. Inclusion does not establish positive sentiment, source freshness, or a specific edition recommendation. No claim is made that all 1,010 candidates are verified technical books.
