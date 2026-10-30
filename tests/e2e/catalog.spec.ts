import { test, expect } from '@playwright/test';

test('search, topic and audience filters intersect, with recoverable empty states', async ({page}) => {
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('.book-card')).toHaveCount(6);
 await page.getByRole('searchbox',{name:'Search books'}).fill('AIMA');
 await expect(page.locator('.book-card')).toHaveCount(1);
 await expect(page.locator('.book-card h3')).toHaveText('Artificial Intelligence: A Modern Approach');
 await page.getByRole('button',{name:'Clear filters'}).click();
 await page.getByRole('button',{name:'Software 2',exact:true}).click();
 await expect(page.locator('.book-card')).toHaveCount(2);
 await page.getByLabel('Reading level').selectOption('Advanced');
 await expect(page.getByRole('heading',{name:'No books found.'})).toBeVisible();
 await page.getByRole('button',{name:'Explore all books'}).click();
 await expect(page.locator('.book-card')).toHaveCount(6);
 await page.getByLabel('Sort books').selectOption('recent');
 await expect(page.locator('.book-card h3').first()).toHaveText('Reinforcement Learning: An Introduction');
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
 await expect(page.getByRole('link',{name:'Read original comment'})).toHaveAttribute('href','https://news.ycombinator.com/item?id=13901769');
 await expect(page.getByRole('link',{name:'View parent conversation'})).toHaveAttribute('href','https://news.ycombinator.com/item?id=13901769&context=3');
 await expect(page.locator('time')).toHaveText('18 Mar 2017');
 await expect(page.locator('blockquote')).toContainText('PAIP is one of most elegant');
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
