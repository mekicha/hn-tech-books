#!/usr/bin/env python3
"""HN discovery, cached thread import, alias matching, and explicit editorial approval.
Standard library only. Nothing fetched is published automatically.
"""
import argparse
from datetime import datetime, timezone
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'data/catalog.json'
API = 'https://hacker-news.firebaseio.com/v0'

class TextParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ('p', 'br', 'li'): self.parts.append(' ')
    def handle_endtag(self, tag):
        if tag in ('p', 'li'): self.parts.append(' ')
    def handle_data(self, value): self.parts.append(value)

def plain_text(value):
    parser = TextParser()
    parser.feed(value or '')
    return re.sub(r'\s+', ' ', ''.join(parser.parts)).strip()

def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temp.replace(path)

def fetch(url):
    for attempt in range(4):
        try:
            request = Request(url, headers={'User-Agent': 'HNBooksMVP/0.1 (curated book research)'})
            with urlopen(request, timeout=30) as response:
                return json.load(response)
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504):
                raise RuntimeError(f'HTTP {exc.code} for {url}. Check network policy and API access.') from exc
            if attempt == 3: raise RuntimeError(f'Retries exhausted for {url}') from exc
            retry = exc.headers.get('Retry-After', '')
            delay = min(float(retry), 30) if retry.isdigit() else 2 ** attempt
            time.sleep(delay)
        except (URLError, TimeoutError) as exc:
            if attempt == 3: raise RuntimeError(f'Could not fetch {url}: {exc}') from exc
            time.sleep(2 ** attempt)

def crawl_thread(thread_id, cache, refresh=False, get=fetch, pause=0.1, max_items=10000):
    """Iterative traversal keeps all ancestors, even ones without book matches."""
    cache = Path(cache)
    pending = [thread_id]
    items = {}
    while pending:
        item_id = pending.pop()
        if str(item_id) in items: continue
        if len(items) >= max_items: raise ValueError('Thread exceeds --max-items; import aborted, not published. Raise the limit and resume.')
        cached = cache / f'{item_id}.json'
        if cached.exists() and not refresh:
            item = json.loads(cached.read_text())
        else:
            item = get(f'{API}/item/{item_id}.json')
            if item is None: raise ValueError(f'Item {item_id} is unavailable; cannot certify a complete thread. Retry later.')
            atomic_json(cached, item)
            if pause: time.sleep(pause)
        if not isinstance(item, dict) or item.get('id') != item_id:
            raise ValueError(f'Invalid API/cache item {item_id}')
        if item_id == thread_id and (item.get('type') != 'story' or item.get('deleted') or item.get('dead')):
            raise ValueError('The root must be an available HN story.')
        items[str(item_id)] = item
        pending.extend(item.get('kids', []))
    return {'threadId':thread_id, 'fetchedAt':datetime.now(timezone.utc).isoformat(), 'complete':True, 'items':items}

def matches(text, alias):
    return bool(re.search(r'(?<!\w)' + re.escape(alias) + r'(?!\w)', text, flags=re.IGNORECASE))

def candidates(bundle, catalog):
    rows = []
    root = bundle['items'][str(bundle['threadId'])]
    for item in bundle['items'].values():
        if item.get('type') != 'comment' or item.get('deleted') or item.get('dead'): continue
        text = plain_text(item.get('text', ''))
        for book in catalog['books']:
            aliases = [book['title'], *book.get('aliases', [])]
            found = [alias for alias in aliases if matches(text, alias)]
            if found:
                parent = bundle['items'].get(str(item.get('parent')), {})
                rows.append({'candidateId':f"{book['slug']}:{item['id']}", 'bookSlug':book['slug'], 'commentId':item['id'], 'threadId':root['id'], 'threadTitle':root.get('title', ''), 'author':item.get('by', '[deleted]'), 'text':text, 'parentId':item.get('parent'), 'parentText':plain_text(parent.get('text', '')), 'matchedAliases':found, 'status':'needs_review'})
    return rows

def approve(catalog, bundle, slug, comment_id, quote, context, thread_context, stance):
    if not bundle.get('complete'): raise ValueError('Only complete imports can be approved.')
    if stance not in ('recommendation', 'qualified recommendation'): raise ValueError('Only positive or qualified recommendations can be published.')
    book = next((b for b in catalog['books'] if b['slug'] == slug), None)
    if not book: raise ValueError('Unknown book slug. Add canonical metadata to the catalog first.')
    item = bundle['items'].get(str(comment_id))
    if not item or item.get('type') != 'comment' or item.get('deleted') or item.get('dead'):
        raise ValueError('Comment must be present and available in the imported thread.')
    if not quote.strip() or quote != quote.strip() or quote not in plain_text(item.get('text', '')):
        raise ValueError('Quote must be a nonempty exact substring of the normalized source comment.')
    if not context.strip() or not thread_context.strip(): raise ValueError('Book context and thread context are required.')
    if any(r['commentId'] == comment_id for r in book['recommendations']):
        raise ValueError('This book/comment pair is already published.')
    # Follow the ancestry to prevent attributing a detached item to this thread.
    ancestor = item
    seen = set()
    while ancestor['id'] != bundle['threadId']:
        if ancestor['id'] in seen: raise ValueError('Cycle in source ancestry.')
        seen.add(ancestor['id'])
        ancestor = bundle['items'].get(str(ancestor.get('parent')))
        if not ancestor: raise ValueError('Missing parent context; cannot establish thread membership.')
    root = bundle['items'][str(bundle['threadId'])]
    date = datetime.fromtimestamp(item['time'], timezone.utc).date().isoformat()
    book['recommendations'].append({'commentId':comment_id, 'author':item.get('by', '[deleted]'), 'quote':quote, 'context':context, 'date':date, 'stance':stance, 'threadId':root['id'], 'threadTitle':root.get('title', ''), 'threadContext':thread_context, 'reviewed':True})
    catalog['updatedAt'] = datetime.now(timezone.utc).date().isoformat()
    return catalog

def discover(query, after, before, max_pages, get=fetch):
    found = {}
    for page in range(max_pages):
        filters = []
        if after: filters.append(f'created_at_i>={int(datetime.fromisoformat(after).replace(tzinfo=timezone.utc).timestamp())}')
        if before: filters.append(f'created_at_i<{int(datetime.fromisoformat(before).replace(tzinfo=timezone.utc).timestamp())}')
        params = {'query':query, 'tags':'story', 'hitsPerPage':100, 'page':page}
        if filters: params['numericFilters'] = ','.join(filters)
        result = get('https://hn.algolia.com/api/v1/search?' + urlencode(params))
        for hit in result.get('hits', []):
            found[hit['objectID']] = {'id':int(hit['objectID']), 'title':hit.get('title'), 'date':hit.get('created_at'), 'url':f"https://news.ycombinator.com/item?id={hit['objectID']}"}
        if page + 1 >= result.get('nbPages', 0):
            return {'query':query, 'coverage':'Search results only, not guaranteed historical completeness.', 'truncated':not result.get('exhaustiveNbHits', False), 'stories':list(found.values())}
    return {'query':query, 'coverage':'Page limit reached. Narrow the date window and retry.', 'truncated':True, 'stories':list(found.values())}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    d = sub.add_parser('discover'); d.add_argument('query'); d.add_argument('--after'); d.add_argument('--before'); d.add_argument('--max-pages', type=int, default=5); d.add_argument('--output', type=Path, default=ROOT/'work/discovery.json')
    t = sub.add_parser('thread'); t.add_argument('id',type=int); t.add_argument('--refresh',action='store_true'); t.add_argument('--max-items',type=int,default=10000); t.add_argument('--cache',type=Path,default=ROOT/'work/cache'); t.add_argument('--output',type=Path,default=ROOT/'work/thread.json')
    c = sub.add_parser('candidates'); c.add_argument('thread',type=Path); c.add_argument('--catalog',type=Path,default=CATALOG); c.add_argument('--output',type=Path,default=ROOT/'work/candidates.json')
    a = sub.add_parser('approve'); a.add_argument('thread',type=Path); a.add_argument('--catalog',type=Path,default=CATALOG); a.add_argument('--book',required=True); a.add_argument('--comment',type=int,required=True); a.add_argument('--quote',required=True); a.add_argument('--context',required=True); a.add_argument('--thread-context',required=True); a.add_argument('--stance',choices=['recommendation','qualified recommendation'],required=True)
    args = parser.parse_args()
    try:
        if args.command == 'discover':
            if args.max_pages < 1: raise ValueError('--max-pages must be positive.')
            if args.after and args.before and args.after >= args.before: raise ValueError('--after must be earlier than --before.')
            value = discover(args.query,args.after,args.before,args.max_pages); atomic_json(args.output,value)
            print(f"Saved {len(value['stories'])} stories to {args.output}. Truncated or non-exhaustive: {value['truncated']}")
        elif args.command == 'thread':
            if args.id < 1 or args.max_items < 1: raise ValueError('IDs and limits must be positive.')
            value = crawl_thread(args.id,args.cache,args.refresh,max_items=args.max_items); atomic_json(args.output,value)
            print(f"Saved complete thread ({len(value['items'])} items) to {args.output}")
        elif args.command == 'candidates':
            value = candidates(json.loads(args.thread.read_text()),json.loads(args.catalog.read_text())); atomic_json(args.output,value)
            print(f'Saved {len(value)} candidates to {args.output}. None have been published.')
        else:
            value = approve(json.loads(args.catalog.read_text()),json.loads(args.thread.read_text()),args.book,args.comment,args.quote,args.context,args.thread_context,args.stance)
            atomic_json(args.catalog,value); print('Approved recommendation saved. Review the Git diff, run checks, and rebuild the app.')
    except (ValueError,RuntimeError,OSError,KeyError) as exc:
        print(f'Import failed: {exc}',file=sys.stderr); return 1
    return 0
if __name__ == '__main__': sys.exit(main())
