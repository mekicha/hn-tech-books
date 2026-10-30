#!/usr/bin/env python3
"""Merge a reviewed metadata/evidence manifest with a complete official HN thread.
Network retrieval stays in hn_import.py; this command validates all changes before
an atomic write, refuses metadata conflicts, and is safe to repeat.
"""
import argparse
import copy
import json
from pathlib import Path
from hn_import import CATALOG, approve, atomic_json, plain_text

def merge(catalog, bundle, manifest):
    result = copy.deepcopy(catalog)
    if not bundle.get('complete') or bundle['threadId'] != manifest['threadId']:
        raise ValueError('Manifest requires its complete source thread')
    slugs = {book['slug']: book for book in result['books']}
    added = 0
    for row in manifest['books']:
        metadata = row['metadata']
        slug = metadata['slug']
        if not slug or not metadata['title'] or not metadata['authors'] or not row['evidence']:
            raise ValueError('Canonical identity and evidence are required')
        if slug in slugs:
            book = slugs[slug]
            if book['title'] != metadata['title'] or book['authors'] != metadata['authors']:
                raise ValueError(f'Conflicting canonical metadata: {slug}')
        else:
            if any(b['title'].casefold() == metadata['title'].casefold() for b in result['books']):
                raise ValueError('Duplicate title under a different slug')
            book = copy.deepcopy(metadata)
            book['recommendations'] = []
            result['books'].append(book)
            slugs[slug] = book
        for evidence in row['evidence']:
            existing = next((r for r in book['recommendations'] if r['commentId'] == evidence['commentId']), None)
            if existing:
                item = bundle['items'][str(evidence['commentId'])]
                if item.get('deleted') or item.get('dead') or existing['quote'] not in plain_text(item.get('text', '')):
                    raise ValueError('Existing source evidence changed; reconcile manually')
                if any(existing[key] != evidence[key] for key in ('quote', 'context', 'stance')):
                    raise ValueError('Conflicting review for existing book/comment pair')
                continue
            approve(result, bundle, slug, evidence['commentId'], evidence['quote'], evidence['context'], manifest['threadContext'], evidence['stance'])
            added += 1
    threads = {r['threadId'] for b in result['books'] for r in b['recommendations']}
    result['coverage'] = f"{len(result['books'])} manually reviewed technical books from {len(threads)} HN discussions. Not a comprehensive index of Hacker News."
    return result, added

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('thread', type=Path)
    parser.add_argument('--catalog', type=Path, default=CATALOG)
    args = parser.parse_args()
    result, added = merge(json.loads(args.catalog.read_text()), json.loads(args.thread.read_text()), json.loads(args.manifest.read_text()))
    atomic_json(args.catalog, result)
    print(f"Stored {len(result['books'])} books; added {added} recommendations")
if __name__ == '__main__':
    main()
