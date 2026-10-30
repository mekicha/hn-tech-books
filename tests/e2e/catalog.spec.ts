import { readFileSync } from 'node:fs';
import type { Book } from '../../lib/catalog';
const books: Book[] = JSON.parse(readFileSync(new URL('../../data/catalog.json', import.meta.url), 'utf8')).books;
import { test, expect } from '@playwright/test';

test('search, topic and audience filters intersect, with recoverable empty states', async ({page}) => {
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('.book-card')).toHaveCount(books.length);
 await page.getByRole('searchbox',{name:'Search books'}).fill('AIMA');
 await expect(page.locator('.book-card')).toHaveCount(1);
 await expect(page.locator('.book-card h3')).toHaveText('Artificial Intelligence: A Modern Approach');
 await page.getByRole('button',{name:'Clear filters'}).click();
 await page.getByRole('button',{name:`Software ${books.filter(b=>b.tags.includes('Software')).length}`,exact:true}).click();
 await expect(page.locator('.book-card')).toHaveCount(books.filter(b=>b.tags.includes('Software')).length);
 await page.getByLabel('Reading level').selectOption('Advanced');
 await page.getByRole('searchbox',{name:'Search books'}).fill('no-such-title-xyz');
 await expect(page.getByRole('heading',{name:'No books found.'})).toBeVisible();
 await page.getByRole('button',{name:'Explore all books'}).click();
 await expect(page.locator('.book-card')).toHaveCount(books.length);
 await page.getByLabel('Sort books').selectOption('recent');
 await expect(page.locator('.book-card h3').first()).toHaveText([...books].sort((a,b)=>b.recommendations.map(r=>r.date).sort().at(-1)!.localeCompare(a.recommendations.map(r=>r.date).sort().at(-1)!) || a.title.localeCompare(b.title))[0].title);
 expect(errors).toEqual([]);
});

test('reading list survives reload and can be removed from book detail',async ({page})=>{
 await page.goto('/');
 const card=page.locator('.book-card').filter({has:page.getByRole('heading',{name:'Deep Learning',exact:true})});
 await card.getByRole('button',{name:'Save to reading list',exact:true}).click();
 await expect(card.getByRole('button',{name:'Remove from reading list'})).toHaveAttribute('aria-pressed','true');
 await page.reload();
 await page.getByRole('link',{name:'Reading list 1'}).click();
 await expect(page.locator('.book-card')).toHaveCount(1);
 await page.getByRole('heading',{name:'Deep Learning',exact:true}).click();
 await expect(page.getByRole('heading',{name:'What HN readers said'})).toBeVisible();
 await page.getByRole('button',{name:'Remove from reading list'}).click();
 await page.getByRole('link',{name:'Reading list 0'}).click();
 await expect(page.getByRole('heading',{name:'Your shelf has room.'})).toBeVisible();
});

test('book evidence has exact source, context, date and editorial labels',async ({page})=>{
 await page.goto('/books/paradigms-of-ai-programming');
 const evidence=page.locator('.recommendation').filter({hasText:'PAIP is one of most elegant'});
 await expect(page.locator('.recommendation')).toHaveCount(books.find(b=>b.slug==='paradigms-of-ai-programming')!.recommendations.length);
 await expect(evidence.getByRole('link',{name:'Read original comment'})).toHaveAttribute('href','https://news.ycombinator.com/item?id=13901769');
 await expect(evidence.getByRole('link',{name:'View parent conversation'})).toHaveAttribute('href','https://news.ycombinator.com/item?id=13901769&context=3');
 await expect(evidence.locator('time')).toHaveText('18 Mar 2017');
 await expect(evidence.locator('blockquote')).toContainText('PAIP is one of most elegant');
 await expect(page.getByText('Catalog note · editorial summary, not a quote')).toBeVisible();
 await expect(page.getByRole('link',{name:'Find editions on Open Library'})).toHaveAttribute('href',/^https:\/\/openlibrary.org\/search\?q=/);
});

test('layout fits viewport, methodology explains limits, and unknown books return 404',async ({page,request})=>{
 await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 await page.getByRole('link',{name:'About',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Small collection, clear limits'})).toBeVisible();
 const result=await request.get('/books/not-a-real-book');
 expect(result.status()).toBe(404);
 await page.goto('/books/not-a-real-book');
 await expect(page.getByRole('heading',{name:'This book isn’t on the shelf.'})).toBeVisible();
});

test('blocked local storage leaves the catalog usable with an explanation',async ({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}});});
 await page.goto('/');
 await expect(page.getByRole('status').filter({hasText:'Browser storage is unavailable'})).toBeVisible();
 await page.locator('.book-card').first().getByRole('button',{name:'Save to reading list',exact:true}).click();
 await expect(page.getByRole('link',{name:'Reading list 1'})).toBeVisible();
});

test('imported books are searchable, source-backed and saved locally',async({page})=>{
 await page.goto('/');
 await page.getByRole('searchbox',{name:'Search books'}).fill('Designing Data-Intensive Applications');
 await expect(page.locator('.book-card')).toHaveCount(1);
 await page.getByRole('heading',{name:'Designing Data-Intensive Applications',exact:true}).click();
 await expect(page.getByRole('link',{name:'Read original comment'})).toHaveAttribute('href','https://news.ycombinator.com/item?id=14488379');
 await page.getByRole('button',{name:'Save to reading list',exact:true}).click();
 await page.reload();await expect(page.getByRole('button',{name:'Remove from reading list'})).toHaveAttribute('aria-pressed','true');
});
