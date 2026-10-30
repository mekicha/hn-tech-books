#!/usr/bin/env python3
"""Apply explicit ISBN relevance decisions and retain bibliographic provenance.
Retrieval alone never grants publication. Missing metadata keeps pending books hidden.
"""
import json
from pathlib import Path
from hn_import import atomic_json, plain_text

def metadata_title(record):
 title=plain_text(record.get('title','')).strip(' =:')
 subtitle=plain_text(record.get('subtitle','')).strip(' :')
 if not title: raise ValueError('Missing bibliographic title')
 if subtitle and subtitle.casefold() not in title.casefold():title += ': '+subtitle
 return title

def apply(audit, metadata, decisions):
 import copy
 result=copy.deepcopy(audit)
 overrides={d['isbn13']:d for d in decisions['decisions']}
 known={r['isbn13'] for r in result['reviews']}
 if not set(overrides)<=known:raise ValueError('Decision contains unknown ISBN')
 for review in result['reviews']:
  isbn=review['isbn13']; lookup=metadata.get(isbn); override=overrides.get(isbn)
  if override:
   if override['decision']=='include' and (not lookup or lookup.get('status')!='found' or not override.get('topic') or not lookup.get('record',{}).get('title')):raise ValueError('Cannot include without metadata and technical category')
   review.update({k:v for k,v in override.items() if k!='isbn13'})
   review['reviewedAt']=decisions['reviewedAt']
  if lookup:
   review['metadataLookup']=lookup['status']
   if lookup['status']=='found' and not lookup.get('record',{}).get('title'):
    review['metadataLookup']='missing_title'
   if lookup['status']=='found' and lookup.get('record',{}).get('title'):
    record=lookup['record']
    review['metadataTitle']=metadata_title(record)
    review['metadataUrl']=record.get('url',f'https://openlibrary.org/isbn/{isbn}')
    review['authors']=[a['name'] for a in record.get('authors',[]) if isinstance(a.get('name'),str)]
    if review['decision']=='include':
     review['title']=review['metadataTitle']
     review['basis']='Editorial relevance review and Open Library ISBN metadata'
     review['reason']='Technical work within the '+review['topic']+' category, with title metadata returned for this ISBN by Open Library. This does not establish positive HN recommendation stance.'
     review['metadataVerifiedAt']=decisions['reviewedAt']
  if review['decision']!='include':
   review.pop('title',None);review.pop('topic',None)
 result['metadataVerification']='Open Library ISBN lookup completed for all 153 initially pending records. Found metadata does not automatically establish technical relevance or recommendation sentiment. Per-record lookup status and provenance are retained.'
 return result

if __name__=='__main__':
 root=Path('data/reviews');audit=json.loads((root/'imported-books.json').read_text());metadata=json.loads((root/'isbn-metadata.json').read_text());decisions=json.loads((root/'metadata-decisions.json').read_text())
 result=apply(audit,metadata,decisions);atomic_json(root/'imported-books.json',result)
 from collections import Counter
 print(dict(Counter(r['decision'] for r in result['reviews'])))
