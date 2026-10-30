import json
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class BookAuditTests(unittest.TestCase):
 def setUp(self):
  self.raw=json.loads((ROOT/'data/hn-book-candidates.json').read_text())['books']
  self.reviews=json.loads((ROOT/'data/reviews/imported-books.json').read_text())['reviews']
 def test_every_record_has_exactly_one_review_disposition(self):
  ids=[r['isbn13'] for r in self.reviews]
  self.assertEqual(len(ids),len(set(ids)))
  self.assertEqual(set(ids),{b['isbn13'] for b in self.raw})
  self.assertTrue(all(r['decision'] in ('include','exclude','needs_metadata') and r['reason'] for r in self.reviews))
 def test_published_titles_are_readable_and_have_a_technical_category(self):
  for r in self.reviews:
   if r['decision']=='include':
    self.assertTrue(r['title'].strip() and r['topic'].strip())
    self.assertFalse(r['title'].startswith('ISBN '))
    self.assertNotIn(' dp ',r['title'])
 def test_fiction_and_sales_are_not_published(self):
  reviews={r['isbn13']:r for r in self.reviews}
  for isbn in ['9780061122415','9781984822185','9780070511132','9780071456074']:
   self.assertEqual(reviews[isbn]['decision'],'exclude')
 def test_unresolved_placeholder_titles_remain_hidden(self):
  reviews={r['isbn13']:r for r in self.reviews}
  for book in self.raw:
   if book['sourceTitle'].startswith('ISBN ') and reviews[book['isbn13']]['decision']=='include':
    self.assertEqual(reviews[book['isbn13']].get('metadataLookup'),'found')
    self.assertFalse(reviews[book['isbn13']]['title'].startswith('ISBN '))

 def test_curated_works_have_relevance_reviews(self):
  audit=json.loads((ROOT/'data/reviews/imported-books.json').read_text())
  catalog=json.loads((ROOT/'data/catalog.json').read_text())
  self.assertEqual({r['slug'] for r in audit['curatedReviews']},{b['slug'] for b in catalog['books']})
  self.assertTrue(all(r['decision']=='include' for r in audit['curatedReviews']))

 def test_all_imports_have_lookup_outcomes_and_pending_books_stay_hidden(self):
  metadata=json.loads((ROOT/'data/reviews/isbn-metadata.json').read_text())
  self.assertEqual(set(metadata),{b['isbn13'] for b in self.raw})
  for review in self.reviews:
   if review['decision']=='needs_metadata':self.assertEqual(metadata[review['isbn13']]['status'],'not_found')
