#!/usr/bin/env python3
"""Retrieve authoritative ISBN metadata for audit; never auto-publish records."""
import argparse
import json
from pathlib import Path
import time
from urllib.parse import urlencode
from hn_import import fetch, atomic_json

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--input',type=Path,default=Path('data/hn-book-candidates.json'))
 p.add_argument('--output',type=Path,default=Path('data/reviews/isbn-metadata.json'))
 p.add_argument('--scope',choices=['all','pending'],default='all')
 p.add_argument('--batch-size',type=int,choices=range(1,21),default=20)
 args=p.parse_args(); books=json.loads(args.input.read_text())['books']
 if args.scope=='pending':
  reviews=json.loads(Path('data/reviews/imported-books.json').read_text())['reviews']
  pending_ids={r['isbn13'] for r in reviews if r['decision']=='needs_metadata'}
  books=[b for b in books if b['isbn13'] in pending_ids]
 existing=json.loads(args.output.read_text()) if args.output.exists() else {}
 pending=[b['isbn13'] for b in books if b['isbn13'] not in existing]
 for offset in range(0,len(pending),args.batch_size):
  batch=pending[offset:offset+args.batch_size]
  url='https://openlibrary.org/api/books?'+urlencode({'bibkeys':','.join('ISBN:'+isbn for isbn in batch),'format':'json','jscmd':'data'})
  data=fetch(url)
  for isbn in batch:
   record=data.get('ISBN:'+isbn)
   existing[isbn]={'status':'found' if record else 'not_found','source':'Open Library Books API','record':record}
  atomic_json(args.output,existing)
  print(f'Metadata checked in selected scope: {sum(b["isbn13"] in existing for b in books)}/{len(books)}',flush=True)
  time.sleep(1)
if __name__=='__main__': main()
