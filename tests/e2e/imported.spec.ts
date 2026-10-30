import {readFileSync} from 'node:fs';
const reviews=JSON.parse(readFileSync(new URL('../../data/reviews/imported-books.json',import.meta.url),'utf8')).reviews as {isbn13:string;decision:string}[];
const imported=JSON.parse(readFileSync(new URL('../../data/hn-book-candidates.json',import.meta.url),'utf8')).books as {isbn13:string;mentions:unknown[]}[];
const included=new Set(reviews.filter(r=>r.decision==='include').map(r=>r.isbn13));
const count=included.size, pages=Math.ceil(count/24), mentions=imported.filter(b=>included.has(b.isbn13)).reduce((n,b)=>n+b.mentions.length,0);
import {test,expect} from '@playwright/test';
test('stored bulk collection can be searched and paginated without live API access',async({page})=>{
 await page.route('https://hn.algolia.com/**',r=>r.abort());
 await page.goto('/imported');
 await expect(page.getByRole('heading',{name:'The technical bookshelf.'})).toBeVisible();
 await expect(page.locator('article.recommendation')).toHaveCount(24);
 const isbn=await page.locator('article.recommendation .eyebrow').first().textContent();
 const value=isbn!.match(/\d{13}/)![0];
 await page.getByRole('navigation',{name:'Imported collection pages top'}).getByRole('link',{name:'Next page',exact:true}).click();await expect(page.getByRole('navigation',{name:'Imported collection pages top'}).getByText('Page 2 of',{exact:false})).toBeVisible();
 await page.getByRole('searchbox',{name:'Search imported books'}).fill(value);await page.getByRole('button',{name:'Search imported books'}).click();
 await expect(page.locator('article.recommendation')).toHaveCount(1);
 await expect(page.getByRole('link',{name:'Read HN source'})).toHaveAttribute('href',/^https:\/\/news.ycombinator.com\/item\?id=\d+$/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('numbered pages preserve search and clamp out-of-range pages',async({page})=>{
 await page.goto('/imported?q=software');
 const nav=page.getByRole('navigation',{name:'Imported collection pages top'});
 await nav.getByRole('link',{name:'Page 2',exact:true}).click();
 await expect(page).toHaveURL(/q=software&page=2/);
 await expect(nav.getByRole('link',{name:'Page 2',exact:true})).toHaveAttribute('aria-current','page');
 await page.goto('/imported?page=99999');
 await expect(nav.getByText(`Page ${pages} of ${pages}`,{exact:true})).toBeVisible();
 await expect(page.locator('article.recommendation')).toHaveCount(count%24||24);
 await expect(nav.getByRole('link',{name:'Next page'})).toHaveCount(0);
 await page.goto('/imported?q=unfindable-isbn-xyz');
 await expect(page.getByText('No matching imports.',{exact:false})).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Imported collection pages top'})).toHaveCount(0);
});

test('home displays the full imported collection and preserves root pagination',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'The technical bookshelf.'})).toBeVisible();
 await expect(page.getByRole('heading',{name:`${count.toLocaleString()} matches`})).toBeVisible();
 await expect(page.getByLabel('Collection totals')).toContainText(`${count.toLocaleString()} published technical editions`);
 await expect(page.getByLabel('Collection totals')).toContainText('30 reviewed books');
 await expect(page.getByLabel('Collection totals')).toContainText(`${mentions.toLocaleString()} HN source mentions`);
 const nav=page.getByRole('navigation',{name:'Imported collection pages top'});
 await nav.getByRole('link',{name:'Page 2',exact:true}).click();
 await expect(page).toHaveURL(/\/\?q=&page=2$/);
 await expect(page.locator('article.recommendation')).toHaveCount(24);
 await page.getByRole('link',{name:'Reviewed books',exact:true}).click();
 await expect(page.locator('.book-card')).toHaveCount(30);
});

test('off-topic and unresolved records stay hidden and technical titles are readable',async({page})=>{
 for(const isbn of ['9780061122415','9781984822185','9780070511132','9780062458193']){
  await page.goto(`/?q=${isbn}`);
  await expect(page.locator('article.recommendation')).toHaveCount(0);
 }
 await page.goto('/?q=9780131103627');
 await expect(page.locator('.imported-book-title')).toHaveText('The C Programming Language');
});

test('metadata-resolved technical books appear while missing and off-topic records remain hidden',async({page})=>{
 await page.goto('/?q=9780133708752');
 await expect(page.locator('.imported-book-title')).toHaveText('ANSI Common Lisp');
 await expect(page.getByText('ISBN metadata checked against Open Library',{exact:true})).toBeVisible();
 await expect(page.locator('.recommendation .authors')).toContainText('Paul Graham');
 for(const isbn of ['9780714878157','9781683928980']){
  await page.goto(`/?q=${isbn}`);
  await expect(page.locator('article.recommendation')).toHaveCount(0);
 }
});
