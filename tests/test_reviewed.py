import copy
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from import_reviewed import merge

class ReviewedImportTests(unittest.TestCase):
    def setUp(self):
        self.catalog = {'books': [], 'coverage': '', 'updatedAt': ''}
        self.bundle = {'complete': True, 'threadId': 1, 'items': {'1': {'id': 1, 'type': 'story', 'title': 'Books'}, '2': {'id': 2, 'type': 'comment', 'parent': 1, 'time': 1, 'text': 'Read Example. Excellent book.', 'by': 'reader'}}}
        self.manifest = {'threadId': 1, 'threadContext': 'Seeking books', 'books': [{'metadata': {'slug': 'example', 'title': 'Example', 'authors': ['Author']}, 'evidence': [{'commentId': 2, 'quote': 'Excellent book.', 'context': 'Endorses Example.', 'stance': 'recommendation'}]}]}
    def test_idempotent_and_does_not_mutate_input(self):
        result, added = merge(self.catalog, self.bundle, self.manifest)
        self.assertEqual(added, 1)
        self.assertEqual(self.catalog['books'], [])
        again, added = merge(result, self.bundle, self.manifest)
        self.assertEqual(again, result)
        self.assertEqual(added, 0)
    def test_bad_quote_and_changed_source_block_merge(self):
        self.manifest['books'][0]['evidence'][0]['quote'] = 'Invented'
        with self.assertRaises(ValueError): merge(self.catalog, self.bundle, self.manifest)
        self.assertEqual(self.catalog['books'], [])
    def test_identity_conflict_blocks_overwrite(self):
        result, _ = merge(self.catalog, self.bundle, self.manifest)
        self.manifest['books'][0]['metadata']['authors'] = ['Someone else']
        with self.assertRaises(ValueError): merge(result, self.bundle, self.manifest)
    def test_incomplete_source_cannot_publish(self):
        self.bundle['complete'] = False
        with self.assertRaises(ValueError): merge(self.catalog, self.bundle, self.manifest)
