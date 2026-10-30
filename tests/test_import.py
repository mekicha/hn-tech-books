import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest
spec = importlib.util.spec_from_file_location('hn_import',Path(__file__).resolve().parents[1]/'scripts/hn_import.py')
hn = importlib.util.module_from_spec(spec); spec.loader.exec_module(hn)

class ImportTests(unittest.TestCase):
 def setUp(self):
  self.items = {'1':{'id':1,'type':'story','title':'Books?','kids':[2,4]},'2':{'id':2,'type':'comment','parent':1,'by':'reader','time':1489795200,'text':'<p>I recommend <i>PAIP</i>.</p>','kids':[3]},'3':{'id':3,'type':'comment','parent':2,'by':'other','time':1489795201,'text':'Not a recommendation for AIMA.'},'4':{'id':4,'type':'comment','parent':1,'deleted':True,'text':'PAIP'}}
  self.bundle = {'threadId':1,'complete':True,'items':self.items}
  self.catalog = {'books':[{'slug':'paip','title':'Paradigms','aliases':['PAIP'],'recommendations':[]},{'slug':'aima','title':'AIMA','aliases':[],'recommendations':[]}]}
 def test_html_normalization_and_alias_boundaries(self):
  self.assertEqual(hn.plain_text('<p>A &amp; B</p><p>C<br>D</p>'),'A & B C D')
  self.assertTrue(hn.matches('Try PAIP.','paip')); self.assertFalse(hn.matches('PAIPer','PAIP'))
 def test_traversal_preserves_context_and_cache_resumes(self):
  calls=[]
  def get(url):
   id=url.rsplit('/',1)[1].split('.')[0]; calls.append(id); return self.items[id]
  with tempfile.TemporaryDirectory() as cache:
   bundle=hn.crawl_thread(1,cache,get=get,pause=0)
   self.assertEqual(len(bundle['items']),4)
   hn.crawl_thread(1,cache,get=get,pause=0)
   self.assertEqual(len(calls),4)
   hn.crawl_thread(1,cache,refresh=True,get=get,pause=0)
   self.assertEqual(len(calls),8)
 def test_candidates_are_unreviewed_and_exclude_deleted(self):
  rows=hn.candidates(self.bundle,self.catalog)
  self.assertEqual(len(rows),2)
  self.assertTrue(all(r['status']=='needs_review' for r in rows))
  # A negative mention is deliberately still a candidate, never automatically endorsed.
  self.assertEqual(rows[1]['bookSlug'],'aima')
  self.assertEqual(rows[1]['parentText'],'I recommend PAIP.')
 def test_approval_checks_quote_membership_and_duplicates(self):
  result=hn.approve(copy.deepcopy(self.catalog),self.bundle,'paip',2,'I recommend PAIP.','Reader endorsement.','The asker wants books.','recommendation')
  rec=result['books'][0]['recommendations'][0]
  self.assertEqual(rec['date'],'2017-03-18'); self.assertTrue(rec['reviewed'])
  with self.assertRaises(ValueError): hn.approve(result,self.bundle,'paip',2,'I recommend PAIP.','context','question','recommendation')
  with self.assertRaises(ValueError): hn.approve(self.catalog,self.bundle,'paip',2,'Invented quote','context','question','recommendation')
  with self.assertRaises(ValueError): hn.approve(self.catalog,self.bundle,'paip',4,'PAIP','context','question','recommendation')
 def test_incomplete_detached_or_negative_items_cannot_be_published(self):
  broken=copy.deepcopy(self.bundle); broken['items']['2']['parent']=99
  with self.assertRaises(ValueError): hn.approve(self.catalog,broken,'paip',2,'PAIP','context','question','recommendation')
  with self.assertRaises(ValueError): hn.approve(self.catalog,dict(self.bundle,complete=False),'paip',2,'PAIP','context','question','recommendation')
  with self.assertRaises(ValueError): hn.approve(self.catalog,self.bundle,'paip',2,'PAIP','context','question','criticism')
 def test_discovery_marks_truncation_and_encodes_dates(self):
  urls=[]
  def get(url):
   urls.append(url); return {'hits':[{'objectID':'1','title':'Books'}],'nbPages':3,'exhaustiveNbHits':True}
  result=hn.discover('AI books','2020-01-01','2021-01-01',1,get=get)
  self.assertTrue(result['truncated']); self.assertEqual(len(result['stories']),1)
  self.assertIn('numericFilters=',urls[0]); self.assertIn('tags=story',urls[0])
 def test_item_limit_and_unavailable_items_do_not_certify_complete(self):
  with tempfile.TemporaryDirectory() as cache:
   with self.assertRaises(ValueError): hn.crawl_thread(1,cache,get=lambda u:self.items[u.rsplit('/',1)[1].split('.')[0]],pause=0,max_items=1)
  with tempfile.TemporaryDirectory() as cache:
   with self.assertRaises(ValueError): hn.crawl_thread(1,cache,get=lambda u:None,pause=0)

if __name__ == '__main__': unittest.main()
