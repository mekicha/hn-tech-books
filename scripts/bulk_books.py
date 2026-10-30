#!/usr/bin/env python3
"""Harvest ISBN-linked HN book candidates. Does not infer endorsement or canonical works."""
import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.parse import urlencode, urlparse, unquote
from hn_import import fetch, atomic_json, plain_text

TECH = re.compile(r'programming|software|computer|algorithm|database|distributed|machine learning|neural|artificial intelligence|mathematic|statistics|probability|cryptograph|security|linux|unix|python|javascript|compiler|operating system|networking|data science|data structure|engineering|physics|electronics|calculus|linear algebra|robotics|haskell|clojure|lisp|prolog|rust|java\b|sql\b|c\+\+', re.I)
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.links=[]; self.current=None
    def handle_starttag(self, tag, attrs):
        if tag == 'a': self.current=[dict(attrs).get('href',''),[]]
    def handle_data(self, value):
        if self.current: self.current[1].append(value)
    def handle_endtag(self, tag):
        if tag == 'a' and self.current:
            self.links.append((self.current[0],''.join(self.current[1]))); self.current=None

def isbn13(value):
    value=value.upper()
    if len(value)==10:
        if not re.fullmatch(r'\d{9}[\dX]',value): return None
        if sum((10-i)*(10 if c=='X' else int(c)) for i,c in enumerate(value))%11: return None
        base='978'+value[:9]
        return base+str((-sum(int(c)*(1 if i%2==0 else 3) for i,c in enumerate(base)))%10)
    if not re.fullmatch(r'97[89]\d{10}',value): return None
    return value if sum(int(c)*(1 if i%2==0 else 3) for i,c in enumerate(value))%10==0 else None

def extract(hit):
    raw=hit.get('comment_text') or ''; text=plain_text(raw)
    if not TECH.search(text): return []
    parser=Links(); parser.feed(raw); found=[]
    for url,label in parser.links:
        parsed=urlparse(url); host=(parsed.hostname or '').lower()
        if not re.fullmatch(r'(?:www\.|smile\.|m\.)?amazon\.(?:com|co\.uk|ca|de|fr|in|com\.au)',host): continue
        match=re.search(r'/(?:dp|gp/product|exec/obidos/ASIN|o/ASIN)/([\dXx]{10})(?:[/?]|$)',parsed.path)
        if not match: continue
        isbn=isbn13(match[1])
        if not isbn: continue
        prefix=unquote(parsed.path[:match.start()]).strip('/').split('/')[-1]
        title=prefix.replace('-',' ').strip()
        if len(title)<5 or title.lower() in ('product','books'): title=plain_text(label)
        if title.startswith(('http','www.')) or len(title)<5: title=f'ISBN {isbn}'
        found.append({'isbn13':isbn,'sourceTitle':title[:240], 'bookUrl':f'https://www.amazon.com/dp/{match[1]}','mention':{'commentId':int(hit['objectID']),'threadId':int(hit['story_id']) if hit.get('story_id') else None,'author':hit.get('author'),'date':hit.get('created_at'),'text':text,'threadTitle':hit.get('story_title'),'sourceUrl':f"https://news.ycombinator.com/item?id={hit['objectID']}"}})
    return found

def run(target, output, cache):
    records={}
    if output.exists():
        for b in json.loads(output.read_text())['books']: records[b['isbn13']]=b
    if len(records) >= target: return len(records)
    for year in range(2026,2006,-1):
        start=int(datetime(year,1,1,tzinfo=timezone.utc).timestamp()); end=int(datetime(year+1,1,1,tzinfo=timezone.utc).timestamp())
        for page in range(10):
            path=cache/f'{year}-{page}.json'
            if path.exists(): data=json.loads(path.read_text())
            else:
                params={'query':'amazon.com','tags':'comment','hitsPerPage':100,'page':page,'numericFilters':f'created_at_i>={start},created_at_i<{end}'}
                data=fetch('https://hn.algolia.com/api/v1/search?'+urlencode(params));atomic_json(path,data);time.sleep(.12)
            for hit in data.get('hits',[]):
                for row in extract(hit):
                    key=row['isbn13']; mention=row.pop('mention')
                    if key not in records: records[key]={**row,'status':'unreviewed','mentions':[]}
                    book=records[key]
                    if book['sourceTitle'].startswith('ISBN ') and not row['sourceTitle'].startswith('ISBN '):book['sourceTitle']=row['sourceTitle']
                    if mention['commentId'] not in {m['commentId'] for m in book['mentions']}:book['mentions'].append(mention)
            atomic_json(output,{'importedAt':datetime.now(timezone.utc).isoformat(),'coverage':'Unreviewed ISBN edition candidates linked in HN comments containing technical terms. Titles are derived from source URLs or anchor text, not authoritative metadata. Different editions may represent the same work. Not all candidates are necessarily technical books or positive recommendations.','books':sorted(records.values(),key=lambda b:b['isbn13'])})
            print(f'{year} page {page+1}: {len(records)} unique ISBN candidates',flush=True)
            if len(records)>=target:return len(records)
            if page+1>=data.get('nbPages',0):break
    return len(records)
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--target',type=int,default=1000);p.add_argument('--output',type=Path,default=Path('data/hn-book-candidates.json'));p.add_argument('--cache',type=Path,default=Path('work/bulk-search'));args=p.parse_args()
    count=run(args.target,args.output,args.cache)
    if count<args.target:raise SystemExit(f'Only {count} candidates found; target not met')
