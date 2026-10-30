import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from apply_metadata_reviews import apply
class MetadataReviewTests(unittest.TestCase):
 def setUp(self):
  self.audit={'reviews':[{'isbn13':'isbn','decision':'needs_metadata','reason':'Unknown'}]}
  self.metadata={'isbn':{'status':'found','record':{'title':'Database Systems','subtitle':'A Practical Guide','authors':[{'name':'An Author'}]}}}
  self.decisions={'reviewedAt':'2026-10-30','decisions':[{'isbn13':'isbn','decision':'include','topic':'Databases','reason':'Technical database text'}]}
 def test_requires_metadata_and_explicit_decision(self):
  with self.assertRaises(ValueError):apply(self.audit,{},self.decisions)
  result=apply(self.audit,self.metadata,{'reviewedAt':'2026-10-30','decisions':[]})
  self.assertEqual(result['reviews'][0]['decision'],'needs_metadata')
 def test_uses_returned_title_and_is_repeatable(self):
  result=apply(self.audit,self.metadata,self.decisions)
  review=result['reviews'][0]
  self.assertEqual(review['title'],'Database Systems: A Practical Guide')
  self.assertEqual(review['authors'],['An Author'])
  self.assertEqual(apply(result,self.metadata,self.decisions),result)
  self.assertEqual(self.audit['reviews'][0]['decision'],'needs_metadata')
 def test_exclusion_never_keeps_publishable_title(self):
  self.decisions['decisions'][0]['decision']='exclude'
  result=apply(self.audit,self.metadata,self.decisions)
  self.assertEqual(result['reviews'][0]['decision'],'exclude')
  self.assertNotIn('title',result['reviews'][0])

 def test_an_untitled_metadata_record_does_not_break_excluded_review(self):
  self.metadata['isbn']['record'].pop('title')
  self.decisions['decisions'][0]['decision']='exclude'
  result=apply(self.audit,self.metadata,self.decisions)
  self.assertEqual(result['reviews'][0]['metadataLookup'],'missing_title')
