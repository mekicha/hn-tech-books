import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from bulk_books import isbn13, extract
class BulkBooksTests(unittest.TestCase):
 def test_isbn_checksum_and_edition_normalization(self):
  self.assertEqual(isbn13('0132350882'),'9780132350884')
  self.assertEqual(isbn13('9780132350884'),'9780132350884')
  self.assertIsNone(isbn13('0132350883'))
  self.assertIsNone(isbn13('B00NOTBOOK1'))
 def test_extract_requires_valid_book_link_and_technical_context(self):
  hit={'objectID':'12','story_id':34,'comment_text':'Software book <a href="https://www.amazon.com/Clean-Code/dp/0132350882">Clean Code</a>'}
  row=extract(hit)[0];self.assertEqual(row['isbn13'],'9780132350884');self.assertEqual(row['sourceTitle'],'Clean Code');self.assertEqual(row['mention']['commentId'],12)
  hit['comment_text']=hit['comment_text'].replace('amazon.com','evil.example');self.assertEqual(extract(hit),[])
 def test_criticism_is_not_transformed_into_endorsement(self):
  hit={'objectID':'12','comment_text':'Do not recommend this software book <a href="https://amazon.com/dp/0132350882">book</a>'}
  row=extract(hit)[0];self.assertIn('Do not recommend',row['mention']['text']);self.assertEqual(row['sourceTitle'],'ISBN 9780132350884')
